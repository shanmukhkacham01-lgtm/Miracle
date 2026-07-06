import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';
import { verifyAuth } from '../../../../middleware/auth';

export async function POST(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);
    const { productId, rating, comment, title } = await req.json();

    if (!productId || !rating || !comment) {
      return NextResponse.json({ message: 'Product ID, rating, and review text are required.' }, { status: 400 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: sessionUser.id,
        productId,
        rating: parseInt(rating, 10),
        comment,
        title: title || '',
      },
    });

    // Update product rating average
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: parseFloat(averageRating.toFixed(1)),
      },
    });

    return NextResponse.json({
      status: 'success',
      review,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Review Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
