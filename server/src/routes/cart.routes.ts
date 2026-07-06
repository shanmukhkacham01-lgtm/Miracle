import { Router } from 'express';
import { getCart, addToCart, updateCartItem, deleteCartItem, clearCart } from '../controllers/cart.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect); // Secure all cart endpoints

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', deleteCartItem);
router.delete('/', clearCart);

export default router;
