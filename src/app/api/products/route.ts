import { NextResponse } from 'next/server';
import prisma from '../../../models/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');
    const color = searchParams.get('color');
    const size = searchParams.get('size');
    const discount = searchParams.get('discount');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '12';

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const where: any = {
      status: 'ACTIVE',
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (brand) {
      where.brand = {
        slug: brand,
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (rating) {
      where.rating = {
        gte: parseFloat(rating),
      };
    }

    if (discount === 'true') {
      where.compareAtPrice = {
        not: null,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // JSON Attributes search
    if (color) {
      where.attributes = {
        path: ['colors'],
        array_contains: color,
      };
    }

    if (size) {
      where.attributes = {
        path: ['sizes'],
        array_contains: size,
      };
    }

    // Sort mappings
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'popular') {
      orderBy = { rating: 'desc' };
    }

    const [products, totalCount] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      status: 'success',
      results: products.length,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      products,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Products Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
