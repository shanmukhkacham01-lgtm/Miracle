import { Response, NextFunction } from 'express';
import prisma from '../models/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { generateInvoicePDF } from '../services/pdf.service';
import { createPushNotification } from '../services/notification.service';
import { sendOrderConfirmationEmail } from '../services/email.service';

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      couponCode,
      shippingAddressId,
      billingAddressId,
      paymentMethod, // STRIPE, RAZORPAY, COD, UPI
      paymentDetails,
      shippingAddress, // Accept inline shipping address details
      items, // Accept inline items
    } = req.body;

    if (!paymentMethod) {
      return next(new AppError('Payment method is required.', 400));
    }

    // 1. Resolve or Create Shipping Address
    let resolvedShippingAddressId = shippingAddressId;
    
    // If shippingAddressId is missing or mock, and inline address is provided, create it!
    if ((!resolvedShippingAddressId || resolvedShippingAddressId === 'mock-addr-id-123') && shippingAddress) {
      const dbAddress = await prisma.address.create({
        data: {
          userId: userId!,
          name: shippingAddress.name || `${req.user?.firstName} ${req.user?.lastName}`,
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
      return next(new AppError('Shipping address is required.', 400));
    }

    // 2. Fetch or Parse Items
    let orderItemsData: Array<{
      productId: string;
      quantity: number;
      price: number;
      color?: string;
      size?: string;
      name: string;
    }> = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          return next(new AppError(`Product not found: ${item.productId}`, 404));
        }
        if (product.stock < item.quantity) {
          return next(new AppError(`Insufficient stock for product ${product.name}.`, 400));
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
        return next(new AppError('Your cart is empty.', 400));
      }

      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          return next(new AppError(`Insufficient stock for product ${item.product.name}.`, 400));
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

    // 3. Calculate Pricing
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
          // Increment coupon usage count
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

    // 4. Generate Order Number
    const orderNumber = `MRL-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

    // 5. Transaction: Create Order & Update Stock
    const result = await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId!,
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

      // Deduct Stock and Write Inventory Logs
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

      // Clear Cart (if exists in DB)
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({
          where: { cartId: userCart.id },
        });
      }

      return order;
    });

    // 6. Award Reward Points (1 point for every $10 spent)
    const pointsAwarded = Math.floor(grandTotal / 10);
    if (pointsAwarded > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsAwarded } },
      });

      await createPushNotification(
        userId!,
        'Points Credited!',
        `You earned ${pointsAwarded} reward points from Order ${orderNumber}.`,
        'REWARD'
      );
    }

    // 7. Notifications
    await createPushNotification(
      userId!,
      'Order Confirmed',
      `Thank you! Your order ${orderNumber} has been received.`,
      'ORDER'
    );

    // Fetch shipping address for confirmation email
    const shippingAddr = shippingAddressId
      ? await prisma.address.findUnique({ where: { id: shippingAddressId } })
      : null;

    // Send rich HTML order confirmation email via Nodemailer
    await sendOrderConfirmationEmail(
      req.user!.email,
      req.user!.firstName,
      {
        orderNumber,
        grandTotal,
        createdAt: new Date(),
        items: cart.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
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

    res.status(201).json({
      status: 'success',
      order: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

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

    res.status(200).json({
      status: 'success',
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: { select: { name: true, images: true, sku: true } },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        payments: true,
      },
    });

    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const requestReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    if (order.status !== 'DELIVERED') {
      return next(new AppError('Only delivered orders can be returned.', 400));
    }

    // Process return request: change status to CANCELLED or custom refund state
    // For simplicity, update order status to REFUNDED (representing approved return and refund)
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
    });

    // Award notifications
    await createPushNotification(
      userId!,
      'Return Initiated',
      `Return request approved for Order ${order.orderNumber}. Refund will be credited.`,
      'ORDER'
    );

    res.status(200).json({
      status: 'success',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber}.pdf`);

    // Call PDF generator with response pipe
    generateInvoicePDF(order, res);
  } catch (error) {
    next(error);
  }
};
