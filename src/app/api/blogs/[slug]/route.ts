import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const blog = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!blog) {
      return NextResponse.json({ message: 'Blog article not found.' }, { status: 404 });
    }

    const relatedBlogs = await prisma.blogPost.findMany({
      where: {
        category: blog.category,
        id: { not: blog.id },
        isPublished: true,
      },
      take: 2,
    });

    return NextResponse.json({
      status: 'success',
      blog,
      relatedBlogs,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Blog by Slug Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
