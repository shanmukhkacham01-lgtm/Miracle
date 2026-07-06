import { NextResponse } from 'next/server';
import prisma from '../../../models/prisma';
import { verifyAuth } from '../../../middleware/auth';

export async function GET(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;

    let cart: any = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                compareAtPrice: true,
                images: true,
                stock: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    }

    return NextResponse.json({
      status: 'success',
      cart,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Cart Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;
    const { productId, quantity = 1, size, color } = await req.json();

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'Product not found or unavailable.' }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ message: `Insufficient stock. Only ${product.stock} items available.` }, { status: 400 });
    }

    let cart: any = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        size: size || null,
        color: color || null,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.stock < newQty) {
        return NextResponse.json({ message: 'Cannot add more. Insufficient stock in inventory.' }, { status: 400 });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size: size || null,
          color: color || null,
        },
      });
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: 'success',
      cart: updatedCart,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Add to Cart Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Cart cleared successfully.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Clear Cart Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
