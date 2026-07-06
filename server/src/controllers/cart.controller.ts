import { Response, NextFunction } from 'express';
import prisma from '../models/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id!;

    let cart: any = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                compareAtPrice: true,
                images: true,
                stock: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    }

    res.status(200).json({
      status: 'success',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity = 1, size, color } = req.body;

    if (!productId) {
      return next(new AppError('Product ID is required.', 400));
    }

    // Check product stock
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== 'ACTIVE') {
      return next(new AppError('Product not found or unavailable.', 404));
    }

    if (product.stock < quantity) {
      return next(new AppError(`Insufficient stock. Only ${product.stock} items available.`, 400));
    }

    let cart: any = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: userId! } });
    }

    // Check if item with same product, size, and color already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        size: size || null,
        color: color || null,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.stock < newQty) {
        return next(new AppError(`Cannot add more. Insufficient stock in inventory.`, 400));
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size,
          color,
        },
      });
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;

    if (quantity === undefined || quantity < 1) {
      return next(new AppError('Quantity must be at least 1.', 400));
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true, cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return next(new AppError('Cart item not found.', 404));
    }

    if (cartItem.product.stock < quantity) {
      return next(new AppError(`Insufficient stock. Only ${cartItem.product.stock} items available.`, 400));
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCartItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return next(new AppError('Cart item not found.', 404));
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully.',
    });
  } catch (error) {
    next(error);
  }
};
