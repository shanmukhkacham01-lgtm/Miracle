import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-04-16' as any }) : null;

export const createStripePaymentIntent = async (amountInUSD: number, orderId: string) => {
  const amountInCents = Math.round(amountInUSD * 100);
  
  if (stripe) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: { orderId },
      });
      return {
        clientSecret: intent.client_secret,
        transactionId: intent.id,
        isMock: false,
      };
    } catch (error: any) {
      console.error('[Stripe integration failed, falling back to mock]:', error.message);
    }
  }

  // Fallback to Simulation Mode
  return {
    clientSecret: `mock_stripe_secret_${Date.now()}`,
    transactionId: `mock_ch_${Date.now()}`,
    isMock: true,
  };
};

export const createRazorpayOrder = async (amountInINR: number, orderId: string) => {
  const hasRazorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

  if (hasRazorpay) {
    try {
      // In a real environment, load razorpay package dynamically or via standard imports
      // Standard dynamic require to avoid failures if not installed or running in mock
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: Math.round(amountInINR * 100), // in paise
        currency: 'INR',
        receipt: orderId,
      };
      const order = await rzp.orders.create(options);
      return {
        razorpayOrderId: order.id,
        amount: order.amount,
        isMock: false,
      };
    } catch (error: any) {
      console.error('[Razorpay integration failed, falling back to mock]:', error.message);
    }
  }

  // Simulation Mode
  return {
    razorpayOrderId: `mock_rzp_order_${Date.now()}`,
    amount: Math.round(amountInINR * 100),
    isMock: true,
  };
};

export const processRefund = async (transactionId: string, amountInUSD: number) => {
  if (transactionId.startsWith('mock_')) {
    return {
      status: 'REFUNDED',
      refundId: `mock_refund_${Date.now()}`,
      amount: amountInUSD,
      isMock: true,
    };
  }

  if (stripe && transactionId.startsWith('pi_')) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: transactionId,
        amount: Math.round(amountInUSD * 100),
      });
      return {
        status: 'REFUNDED',
        refundId: refund.id,
        amount: amountInUSD,
        isMock: false,
      };
    } catch (error: any) {
      console.error('[Stripe refund error]:', error.message);
      throw error;
    }
  }

  return {
    status: 'REFUNDED',
    refundId: `manual_refund_${Date.now()}`,
    amount: amountInUSD,
    isMock: true,
  };
};
