import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || typeof q !== 'string') {
      return NextResponse.json({ status: 'success', suggestions: [] }, { status: 200 });
    }

    const products = await prisma.product.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        status: 'ACTIVE',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      suggestions: products,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Search Suggestions Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
