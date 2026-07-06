import { Request, Response, NextFunction } from 'express';
import prisma from '../models/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      color,
      size,
      discount,
      search,
      sort,
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const where: any = {
      status: 'ACTIVE',
    };

    if (category) {
      where.category = {
        slug: category as string,
      };
    }

    if (brand) {
      where.brand = {
        slug: brand as string,
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (rating) {
      where.rating = {
        gte: parseFloat(rating as string),
      };
    }

    if (discount === 'true') {
      where.compareAtPrice = {
        not: null,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Advanced JSON filtering for Color and Size inside attributes
    // e.g. attributes: { colors: ['black', 'gold'], sizes: ['S', 'M'] }
    if (color) {
      where.attributes = {
        path: ['colors'],
        array_contains: color as string,
      };
    }

    if (size) {
      where.attributes = {
        path: ['sizes'],
        array_contains: size as string,
      };
    }

    // Sort mappings
    let orderBy: any = { createdAt: 'desc' }; // default: Newest
    if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'popular') {
      orderBy = { rating: 'desc' };
    }

    // Fetch products
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

    res.status(200).json({
      status: 'success',
      results: products.length,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

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
      return next(new AppError('Product not found.', 404));
    }

    // Fetch related products (same category, excluding current)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'ACTIVE',
      },
      take: 4,
      include: { brand: { select: { name: true } } },
    });

    // Fetch frequently bought together (mock logic: other best sellers in the same category)
    const frequentlyBought = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        rating: { gte: 4.2 },
        status: 'ACTIVE',
      },
      take: 2,
      include: { brand: { select: { name: true } } },
    });

    res.status(200).json({
      status: 'success',
      product,
      relatedProducts,
      frequentlyBought,
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, rating, comment, title } = req.body;
    const userId = req.user?.id;

    if (!productId || !rating || !comment || !userId) {
      return next(new AppError('Product ID, rating, and review text are required.', 400));
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: parseInt(rating, 10),
        comment,
        title,
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

    res.status(201).json({
      status: 'success',
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const getSearchSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(200).json({ status: 'success', suggestions: [] });
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

    res.status(200).json({
      status: 'success',
      suggestions: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, image: true },
    });
    const brands = await prisma.brand.findMany({
      select: { id: true, name: true, slug: true, logo: true },
    });

    res.status(200).json({
      status: 'success',
      categories,
      brands,
    });
  } catch (error) {
    next(error);
  }
};
