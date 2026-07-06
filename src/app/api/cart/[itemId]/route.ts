import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';
import { verifyAuth } from '../../../../middleware/auth';

export async function PUT(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;
    const { itemId } = params;
    const { quantity } = await req.json();

    if (quantity === undefined || quantity < 1) {
      return NextResponse.json({ message: 'Quantity must be at least 1.' }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true, cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return NextResponse.json({ message: 'Cart item not found.' }, { status: 404 });
    }

    if (cartItem.product.stock < quantity) {
      return NextResponse.json({ message: `Insufficient stock. Only ${cartItem.product.stock} items available.` }, { status: 400 });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

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
    console.error('[Update Cart Item Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;
    const { itemId } = params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return NextResponse.json({ message: 'Cart item not found.' }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

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
    console.error('[Delete Cart Item Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
