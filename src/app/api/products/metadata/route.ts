import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';

export async function GET(req: Request) {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, image: true },
    });
    const brands = await prisma.brand.findMany({
      select: { id: true, name: true, slug: true, logo: true },
    });

    return NextResponse.json({
      status: 'success',
      categories,
      brands,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Metadata Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
