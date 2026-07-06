import { NextResponse } from 'next/server';
import prisma from '../../../../../models/prisma';
import { verifyAuth } from '../../../../../middleware/auth';
import { generateInvoicePDF } from '../../../../../services/pdf';

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
            product: { select: { name: true } },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    const pdfBuffer = await generateInvoicePDF(order);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Invoice-${order.orderNumber}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('[Download Invoice Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
