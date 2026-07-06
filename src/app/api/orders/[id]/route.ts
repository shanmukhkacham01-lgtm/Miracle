import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';
import { verifyAuth } from '../../../../middleware/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;
    const { id } = params;

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
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      order,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Order Details Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
