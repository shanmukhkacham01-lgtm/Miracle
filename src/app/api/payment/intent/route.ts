import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../middleware/auth';
import { createStripePaymentIntent, createRazorpayOrder } from '../../../../services/payment';

export async function POST(req: Request) {
  try {
    await verifyAuth(req);
    const { amount, orderId, provider } = await req.json();

    if (!amount || !orderId || !provider) {
      return NextResponse.json({ message: 'Please specify orderId, amount, and provider (STRIPE or RAZORPAY).' }, { status: 400 });
    }

    if (provider === 'STRIPE') {
      const intentData = await createStripePaymentIntent(amount, orderId);
      return NextResponse.json({ status: 'success', ...intentData }, { status: 200 });
    }

    if (provider === 'RAZORPAY') {
      // Razorpay uses INR. Let's convert USD amount to INR (mock rate: 1 USD = 83 INR)
      const amountInINR = amount * 83;
      const orderData = await createRazorpayOrder(amountInINR, orderId);
      return NextResponse.json({ status: 'success', ...orderData }, { status: 200 });
    }

    return NextResponse.json({ message: 'Unsupported payment provider.' }, { status: 400 });
  } catch (error: any) {
    console.error('[Payment Intent Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
