import { NextResponse } from 'next/server';
import prisma from '../../../models/prisma';
import { verifyAuth } from '../../../middleware/auth';
import { createPushNotification } from '../../../services/notification';
import { sendOrderConfirmationEmail } from '../../../services/email';

export async function GET(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      status: 'success',
      orders,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Orders Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;

    const {
      couponCode,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      paymentDetails,
      shippingAddress,
      items,
    } = await req.json();

    if (!paymentMethod) {
      return NextResponse.json({ message: 'Payment method is required.' }, { status: 400 });
    }

    let resolvedShippingAddressId = shippingAddressId;

    // If shippingAddressId is missing or mock, and inline address is provided, create it!
    if ((!resolvedShippingAddressId || resolvedShippingAddressId === 'mock-addr-id-123') && shippingAddress) {
      const dbAddress = await prisma.address.create({
        data: {
          userId,
          name: shippingAddress.name || `${sessionUser.firstName} ${sessionUser.lastName}`,
          phone: shippingAddress.phone || '',
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state || '',
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country || 'India',
          type: 'SHIPPING',
          isDefault: true,
        },
      });
      resolvedShippingAddressId = dbAddress.id;
    }

    if (!resolvedShippingAddressId) {
      return NextResponse.json({ message: 'Shipping address is required.' }, { status: 400 });
    }

    let orderItemsData: any[] = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          return NextResponse.json({ message: `Product not found: ${item.productId}` }, { status: 404 });
        }
        if (product.stock < item.quantity) {
          return NextResponse.json({ message: `Insufficient stock for product ${product.name}.` }, { status: 400 });
        }
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          color: item.color,
          size: item.size,
          name: product.name,
        });
      }
    } else {
      // Fallback: Fetch Cart Items from DB
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 });
      }

      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          return NextResponse.json({ message: `Insufficient stock for product ${item.product.name}.` }, { status: 400 });
        }
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          color: item.color || undefined,
          size: item.size || undefined,
          name: item.product.name,
        });
      }
    }

    let totalAmount = 0;
    orderItemsData.forEach((item) => {
      totalAmount += item.price * item.quantity;
    });

    let discountAmount = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.isActive && new Date() >= coupon.startsAt && new Date() <= coupon.expiresAt) {
        if (totalAmount >= coupon.minOrderValue) {
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (totalAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    const shippingCost = totalAmount > 200 ? 0.0 : 15.0; // Free shipping over $200
    const taxAmount = parseFloat(((totalAmount - discountAmount) * 0.08).toFixed(2)); // 8% Tax
    const grandTotal = parseFloat((totalAmount - discountAmount + shippingCost + taxAmount).toFixed(2));

    const orderNumber = `MRL-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount,
          discountAmount,
          shippingCost,
          taxAmount,
          grandTotal,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED',
          status: 'PENDING',
          shippingAddressId: resolvedShippingAddressId,
          billingAddressId: billingAddressId || resolvedShippingAddressId,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              selectedColor: item.color,
              selectedSize: item.size,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Deduct Stock
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            quantityChanged: -item.quantity,
            type: 'SALE',
            reason: `Order placed: ${orderNumber}`,
          },
        });
      }

      // Create Payment Transaction
      const transactionId = paymentDetails?.transactionId || `tx_${Date.now()}`;
      await tx.payment.create({
        data: {
          orderId: order.id,
          transactionId,
          provider: paymentMethod,
          amount: grandTotal,
          status: paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED',
          rawResponse: paymentDetails || {},
        },
      });

      // Clear Cart
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({
          where: { cartId: userCart.id },
        });
      }

      return order;
    });

    // Reward points
    const pointsAwarded = Math.floor(grandTotal / 10);
    if (pointsAwarded > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsAwarded } },
      });

      await createPushNotification(
        userId,
        'Points Credited!',
        `You earned ${pointsAwarded} reward points from Order ${orderNumber}.`,
        'REWARD'
      );
    }

    await createPushNotification(
      userId,
      'Order Confirmed',
      `Thank you! Your order ${orderNumber} has been received.`,
      'ORDER'
    );

    const shippingAddr = resolvedShippingAddressId
      ? await prisma.address.findUnique({ where: { id: resolvedShippingAddressId } })
      : null;

    // Send confirmation email
    await sendOrderConfirmationEmail(
      sessionUser.email,
      sessionUser.firstName,
      {
        orderNumber,
        grandTotal,
        createdAt: new Date(),
        items: orderItemsData.map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        shippingAddress: shippingAddr ? {
          street: shippingAddr.street,
          city: shippingAddr.city,
          state: shippingAddr.state,
          country: shippingAddr.country,
          postalCode: shippingAddr.postalCode,
        } : undefined,
      }
    );

    return NextResponse.json({
      status: 'success',
      order: result,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Order Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
