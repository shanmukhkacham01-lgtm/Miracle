import { Router } from 'express';
import { createOrder, getOrders, getOrderDetails, requestReturn, downloadInvoice } from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect); // Secure all order endpoints

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderDetails);
router.post('/:id/return', requestReturn);
router.get('/:id/invoice', downloadInvoice);

export default router;
