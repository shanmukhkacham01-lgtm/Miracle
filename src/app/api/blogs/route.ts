import { NextResponse } from 'next/server';
import prisma from '../../../models/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const where: any = { isPublished: true };

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    const blogs = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      status: 'success',
      blogs,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Blogs Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
