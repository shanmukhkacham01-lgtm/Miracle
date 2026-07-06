import { Router } from 'express';
import { getProducts, getProductBySlug, createReview, getSearchSuggestions, getMetadata } from '../controllers/product.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getProducts);
router.get('/search-suggestions', getSearchSuggestions);
router.get('/metadata', getMetadata);
router.get('/:slug', getProductBySlug);

// Protected reviews route
router.post('/review', protect, createReview);

export default router;
