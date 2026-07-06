import { NextResponse } from 'next/server';
import prisma from '../../../../../models/prisma';
import { verifyAuth } from '../../../../../middleware/auth';
import { createPushNotification } from '../../../../../services/notification';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await verifyAuth(req);
    const userId = sessionUser.id;
    const { id } = params;
    const { reason } = await req.json();

    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ message: 'Only delivered orders can be returned.' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
    });

    await createPushNotification(
      userId,
      'Return Initiated',
      `Return request approved for Order ${order.orderNumber}. Refund will be credited.`,
      'ORDER'
    );

    return NextResponse.json({
      status: 'success',
      order: updatedOrder,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Request Return Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
