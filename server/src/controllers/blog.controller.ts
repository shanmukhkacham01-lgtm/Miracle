import { Request, Response, NextFunction } from 'express';
import prisma from '../models/prisma';
import { AppError } from '../middleware/error.middleware';

export const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, tag } = req.query;

    const where: any = { isPublished: true };

    if (category) {
      where.category = category as string;
    }

    if (tag) {
      where.tags = {
        has: tag as string,
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

    res.status(200).json({
      status: 'success',
      blogs,
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!blog) {
      return next(new AppError('Blog article not found.', 404));
    }

    const relatedBlogs = await prisma.blogPost.findMany({
      where: {
        category: blog.category,
        id: { not: blog.id },
        isPublished: true,
      },
      take: 2,
    });

    res.status(200).json({
      status: 'success',
      blog,
      relatedBlogs,
    });
  } catch (error) {
    next(error);
  }
};
