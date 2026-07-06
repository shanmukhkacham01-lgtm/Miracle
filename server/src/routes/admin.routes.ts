import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  getAnalytics,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers,
  updateUserRole,
  updateAdminUser,
  deleteAdminUser,
  getAdminAddresses,
  createAdminAddress,
  updateAdminAddress,
  deleteAdminAddress,
  getAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
} from '../controllers/admin.controller';

const router = Router();

// Apply global admin middleware protection
router.use(protect);
router.use(restrictTo('ADMIN', 'SUPERADMIN'));

// Analytics
router.get('/analytics', getAnalytics);

// Product CRUD
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Category CRUD
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Coupon CRUD
router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Orders CRUD
router.get('/orders', getAdminOrders);
router.put('/orders/:id', updateOrderStatus);

// Users CRUD
router.get('/users', getAdminUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

// Address CRUD
router.get('/addresses', getAdminAddresses);
router.post('/addresses', createAdminAddress);
router.put('/addresses/:id', updateAdminAddress);
router.delete('/addresses/:id', deleteAdminAddress);

// Brands CRUD
router.get('/brands', getAdminBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Banners management
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

export default router;
