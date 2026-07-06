import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        reviews: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    // Fetch related products (same category)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'ACTIVE',
      },
      take: 4,
      include: { brand: { select: { name: true } } },
    });

    // Mock frequently bought together
    const frequentlyBought = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: 'ACTIVE',
      },
      take: 2,
    });

    return NextResponse.json({
      status: 'success',
      product,
      relatedProducts,
      frequentlyBought,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Product by Slug Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
