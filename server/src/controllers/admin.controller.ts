import { Request, Response, NextFunction } from 'express';
import prisma from '../models/prisma';
import { AppError } from '../middleware/error.middleware';
import { processRefund } from '../services/payment.service';
import { sendOrderStatusEmail, sendLowStockAlertEmail, sendNewOrderAdminEmail } from '../services/email.service';

// ----------------------------------------------------
// 1. Dashboard Analytics
// ----------------------------------------------------
export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Totals
    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.user.count({ where: { role: 'USER' } });
    const totalProducts = await prisma.product.count();

    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'COMPLETED',
        status: { in: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'] },
      },
      select: { grandTotal: true },
    });
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + curr.grandTotal, 0);

    // Recent Orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Inventory Alerts (stock <= 5)
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 5 } },
      select: { id: true, name: true, sku: true, stock: true },
    });

    // Monthly Sales Graph Data (Simulated/Aggregation for the last 6 months)
    const salesGraph = [
      { month: 'Jan', sales: 4500, orders: 35 },
      { month: 'Feb', sales: 5800, orders: 42 },
      { month: 'Mar', sales: 8200, orders: 58 },
      { month: 'Apr', sales: 7100, orders: 50 },
      { month: 'May', sales: 11200, orders: 85 },
      { month: 'Jun', sales: totalRevenue > 0 ? parseFloat(totalRevenue.toFixed(0)) : 14500, orders: totalOrders > 0 ? totalOrders : 110 },
    ];

    res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
        },
        recentOrders,
        inventoryAlerts: lowStockProducts,
        salesGraph,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 2. Product CRUD
// ----------------------------------------------------
export const getAdminProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ status: 'success', products });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, compareAtPrice, stock, sku, categoryId, brandId, images, attributes, details } = req.body;

    if (!name || !price || !sku || !categoryId || !brandId) {
      return next(new AppError('Please provide name, price, sku, categoryId, and brandId.', 400));
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock: parseInt(stock, 10) || 0,
        sku,
        categoryId,
        brandId,
        images: images || [],
        attributes: attributes || {},
        details: details || {},
        status: parseInt(stock) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
      },
    });

    // Write Inventory log
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        quantityChanged: product.stock,
        type: 'RESTOCK',
        reason: 'Initial Product Creation',
      },
    });

    res.status(201).json({ status: 'success', product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) return next(new AppError('Product not found.', 404));

    if (data.price) data.price = parseFloat(data.price);
    if (data.compareAtPrice) data.compareAtPrice = parseFloat(data.compareAtPrice);
    
    let stockChanged = 0;
    if (data.stock !== undefined) {
      data.stock = parseInt(data.stock, 10);
      stockChanged = data.stock - existingProduct.stock;
      data.status = data.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    // Write Inventory log if stock modified
    if (stockChanged !== 0) {
      await prisma.inventoryLog.create({
        data: {
          productId: product.id,
          quantityChanged: stockChanged,
          type: stockChanged > 0 ? 'RESTOCK' : 'ADJUSTMENT',
          reason: 'Manual Admin Inventory Update',
        },
      });
    }

    res.status(200).json({ status: 'success', product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 3. Category CRUD
// ----------------------------------------------------
export const getAdminCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ status: 'success', categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, image } = req.body;
    if (!name) return next(new AppError('Category name required.', 400));

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await prisma.category.create({
      data: { name, slug, image },
    });

    res.status(201).json({ status: 'success', category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 4. Coupon CRUD
// ----------------------------------------------------
export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiresAt } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiresAt) {
      return next(new AppError('Please supply coupon code, type, value, and expiration date.', 400));
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        expiresAt: new Date(expiresAt),
      },
    });

    res.status(201).json({ status: 'success', coupon });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ status: 'success', coupons });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 5. Order Management
// ----------------------------------------------------
export const getAdminOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ status: 'success', orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!order) return next(new AppError('Order not found.', 404));

    const updatedData: any = {};
    if (status) updatedData.status = status;
    if (trackingNumber) updatedData.trackingNumber = trackingNumber;

    // Handle payment status adjustments automatically
    if (status === 'DELIVERED') {
      updatedData.paymentStatus = 'COMPLETED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updatedData,
    });

    // If order was cancelled / refunded, trigger payment refunds
    if (status === 'CANCELLED' || status === 'REFUNDED') {
      const activePayment = order.payments.find(p => p.status === 'COMPLETED');
      if (activePayment) {
        // Process refund at gateway
        await processRefund(activePayment.transactionId, order.grandTotal);
        
        await prisma.payment.update({
          where: { id: activePayment.id },
          data: { status: 'REFUNDED' },
        });

        await prisma.order.update({
          where: { id },
          data: { paymentStatus: 'REFUNDED' },
        });
      }

      // Restock products
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await prisma.inventoryLog.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            type: 'RETURN',
            reason: `Order cancelled/refunded: ${order.orderNumber}`,
          },
        });
      }
    }

    // Send order status email to the customer
    if (status) {
      const customer = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { email: true, firstName: true },
      });
      if (customer) {
        await sendOrderStatusEmail(
          customer.email,
          customer.firstName,
          order.orderNumber,
          status,
          trackingNumber
        );
      }
    }

    // Check for low-stock products and alert admin
    const lowStock = await prisma.product.findMany({
      where: { stock: { lte: 5, gt: 0 } },
      select: { name: true, sku: true, stock: true },
    });
    if (lowStock.length > 0) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { email: true },
      });
      if (adminUser) {
        sendLowStockAlertEmail(adminUser.email, lowStock).catch(() => {});
      }
    }

    res.status(200).json({ status: 'success', order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 6. User Management
// ----------------------------------------------------
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, points: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ status: 'success', users });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // USER, ADMIN, SUPERADMIN

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.status(200).json({ status: 'success', user });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 7. Banner CRUD
// ----------------------------------------------------
export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, position } = req.body;
    if (!title || !imageUrl) return next(new AppError('Banner title and image are required.', 400));

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        position: parseInt(position, 10) || 0,
      },
    });

    res.status(201).json({ status: 'success', banner });
  } catch (error) {
    next(error);
  }
};

export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { position: 'asc' },
    });
    res.status(200).json({ status: 'success', banners });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, linkUrl, position, isActive } = req.body;
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        position: position !== undefined ? parseInt(position, 10) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });
    res.status(200).json({ status: 'success', banner });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 8. User Management CRUD
// ----------------------------------------------------
export const updateAdminUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, points } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        email,
        firstName,
        lastName,
        role,
        points: points !== undefined ? parseInt(points, 10) : undefined,
      },
    });
    res.status(200).json({ status: 'success', user });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 9. Address Management CRUD
// ----------------------------------------------------
export const getAdminAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ status: 'success', addresses });
  } catch (error) {
    next(error);
  }
};

export const createAdminAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, street, city, state, postalCode, country, name, phone } = req.body;
    if (!userId || !street || !city || !state || !postalCode || !country || !name || !phone) {
      return next(new AppError('Please provide all address details including name and phone.', 400));
    }
    const address = await prisma.address.create({
      data: {
        userId,
        name,
        phone,
        street,
        city,
        state,
        postalCode,
        country,
      },
    });
    res.status(201).json({ status: 'success', address });
  } catch (error) {
    next(error);
  }
};

export const updateAdminAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { street, city, state, postalCode, country } = req.body;
    const address = await prisma.address.update({
      where: { id },
      data: {
        street,
        city,
        state,
        postalCode,
        country,
      },
    });
    res.status(200).json({ status: 'success', address });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 10. Campaign & Taxonomy Updates
// ----------------------------------------------------
export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiresAt } = req.body;
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code ? code.toUpperCase() : undefined,
        discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : undefined,
        minOrderValue: minOrderValue !== undefined ? parseFloat(minOrderValue) : undefined,
        maxDiscount: maxDiscount !== undefined ? parseFloat(maxDiscount) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });
    res.status(200).json({ status: 'success', coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;
    const data: any = {};
    if (name) {
      data.name = name;
      data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (image !== undefined) data.image = image;
    const category = await prisma.category.update({
      where: { id },
      data,
    });
    res.status(200).json({ status: 'success', category });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 11. Brand Management CRUD
// ----------------------------------------------------
export const getAdminBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ status: 'success', brands });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, image } = req.body;
    if (!name) return next(new AppError('Brand name required.', 400));
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brand = await prisma.brand.create({
      data: { name, slug, logo: image },
    });
    res.status(201).json({ status: 'success', brand });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;
    const data: any = {};
    if (name) {
      data.name = name;
      data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (image !== undefined) data.logo = image;
    const brand = await prisma.brand.update({
      where: { id },
      data,
    });
    res.status(200).json({ status: 'success', brand });
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.brand.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
