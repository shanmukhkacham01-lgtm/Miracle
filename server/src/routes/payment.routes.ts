import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createStripePaymentIntent, createRazorpayOrder } from '../services/payment.service';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(protect); // Secure billing endpoints

router.post('/intent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, orderId, provider } = req.body;

    if (!amount || !orderId || !provider) {
      return next(new AppError('Please specify orderId, amount, and provider (STRIPE or RAZORPAY).', 400));
    }

    if (provider === 'STRIPE') {
      const intentData = await createStripePaymentIntent(amount, orderId);
      return res.status(200).json({ status: 'success', ...intentData });
    }

    if (provider === 'RAZORPAY') {
      // Razorpay uses INR. Let's convert USD amount to INR (mock rate: 1 USD = 83 INR)
      const amountInINR = amount * 83;
      const orderData = await createRazorpayOrder(amountInINR, orderId);
      return res.status(200).json({ status: 'success', ...orderData });
    }

    return next(new AppError('Unsupported payment provider.', 400));
  } catch (error) {
    next(error);
  }
});

export default router;
