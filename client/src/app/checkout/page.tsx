'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { clearCart, formatPrice } from '../../store/cartSlice';
import { api } from '../../utils/api';
import { ShoppingBag, ChevronRight, CreditCard, QrCode, Truck, CheckCircle2, Download, Check, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, currency } = useAppSelector((state) => state.cart);

  // Form inputs
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('United States');

  // Coupon Code
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'RAZORPAY' | 'UPI' | 'COD'>('STRIPE');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [upiId, setUpiId] = useState('');

  // Order state
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Redirect to login if user not authenticated
  useEffect(() => {
    const token = localStorage.getItem('miracle_access_token');
    if (!token) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [router]);

  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  // Apply Coupon Math
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const shippingCost = subtotal > 200 ? 0.0 : 15.0;
  const taxAmount = parseFloat(((subtotal - discountAmount) * 0.08).toFixed(2));
  const grandTotal = parseFloat((subtotal - discountAmount + shippingCost + taxAmount).toFixed(2));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();

    if (code === 'WELCOME10') {
      setAppliedCoupon({ code, discountType: 'PERCENTAGE', discountValue: 10 });
    } else if (code === 'LUXURY50' && subtotal >= 300) {
      setAppliedCoupon({ code, discountType: 'FIXED', discountValue: 50 });
    } else if (code === 'LUXURY50') {
      setCouponError('LUXURY50 requires minimum order value of ₹24,900');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setOrderProcessing(true);
    setCheckoutError('');

    const shippingAddressData = {
      name: `${firstName} ${lastName}`,
      phone,
      street,
      city,
      state: stateCode,
      postalCode: zip,
      country,
    };

    try {
      const response = await api.post('/orders', {
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod,
        shippingAddress: shippingAddressData,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color || '',
          size: item.size || '',
        }))
      });

      const confirmedData = {
        orderNumber: response.data.order.orderNumber,
        items,
        subtotal,
        discountAmount,
        shippingCost,
        taxAmount,
        grandTotal,
        paymentMethod,
        shippingAddress: shippingAddressData,
        createdAt: response.data.order.createdAt,
      };

      setConfirmedOrder(confirmedData);
      dispatch(clearCart());

      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#C8A97E', '#111111', '#E8E8E8'],
      });
    } catch (err: any) {
      console.error('Order creation failed:', err);
      setCheckoutError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setOrderProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!confirmedOrder) return;
    
    // Generate text/csv data or mock invoice details to download as file
    const invoiceText = `
MIRACLE STUDIO - INVOICE
========================
Order Number: ${confirmedOrder.orderNumber}
Date: ${new Date(confirmedOrder.createdAt).toLocaleDateString()}
Status: Paid / Processing

Billed To:
${confirmedOrder.shippingAddress.name}
${confirmedOrder.shippingAddress.street}
${confirmedOrder.shippingAddress.city}, ${confirmedOrder.shippingAddress.state} ${confirmedOrder.shippingAddress.postalCode}
${confirmedOrder.shippingAddress.country}

Items:
${confirmedOrder.items.map((i: any) => `- ${i.name} (${i.color}/${i.size}) x${i.quantity} @ ${formatPrice(i.price, currency)}`).join('\n')}

Subtotal: ${formatPrice(confirmedOrder.subtotal, currency)}
Discount: -${formatPrice(confirmedOrder.discountAmount, currency)}
Tax (8%): ${formatPrice(confirmedOrder.taxAmount, currency)}
Shipping: ${confirmedOrder.shippingCost === 0 ? 'Free' : formatPrice(confirmedOrder.shippingCost, currency)}
------------------------
Grand Total: ${formatPrice(confirmedOrder.grandTotal, currency)}
========================
Thank you for choosing MIRACLE. Discover the Extraordinary.
    `;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${confirmedOrder.orderNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center space-y-6 animate-fade">
        <CheckCircle2 size={64} className="text-luxury-gold mx-auto" />
        <h1 className="font-serif text-3xl font-semibold">Order Confirmed</h1>
        <p className="text-sm text-luxury-muted leading-relaxed">
          Thank you for your purchase. Your order <span className="font-bold text-luxury-text">{confirmedOrder.orderNumber}</span> is being prepared for dispatch.
        </p>

        <div className="bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder rounded-luxury p-6 text-left text-xs space-y-4">
          <h4 className="font-serif text-sm font-semibold border-b border-luxury-border dark:border-luxury-darkBorder pb-2">Delivery Details</h4>
          <p>Recipient: {confirmedOrder.shippingAddress.name}</p>
          <p>Address: {confirmedOrder.shippingAddress.street}, {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} {confirmedOrder.shippingAddress.postalCode}</p>
          <p>Method: Carbon Neutral Priority Shipping</p>
          <p className="pt-2 border-t border-luxury-border dark:border-luxury-darkBorder text-[10px] font-bold text-luxury-gold">
            Estimated Delivery: 3 - 5 Business Days
          </p>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleDownloadInvoice}
            className="flex-grow py-3 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all flex items-center justify-center space-x-2"
          >
            <Download size={14} />
            <span>Download Invoice</span>
          </button>
          <button
            onClick={() => router.push('/shop')}
            className="flex-grow py-3 border border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-xs font-bold tracking-widest rounded-luxury transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Forms */}
        <div className="lg:col-span-7 space-y-8">
          <h1 className="font-serif text-2xl font-semibold border-b border-luxury-border dark:border-luxury-darkBorder pb-4">Secure Checkout</h1>

          {checkoutError && (
            <div className="p-4 bg-luxury-danger/10 text-luxury-danger border border-luxury-danger/20 rounded-luxury text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>{checkoutError}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="space-y-8 text-xs font-semibold">
            
            {/* Contact details */}
            <div className="space-y-4">
              <h3 className="font-serif text-base font-semibold text-luxury-muted uppercase tracking-wider">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-luxury-muted">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-luxury-muted">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address details */}
            <div className="space-y-4 pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              <h3 className="font-serif text-base font-semibold text-luxury-muted uppercase tracking-wider">Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-luxury-muted">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Julian"
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-luxury-muted">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Gray"
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-luxury-muted">Street Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="123 Mercer Street, Apt 4B"
                  className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-luxury-muted">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-luxury-muted">State</label>
                  <input
                    type="text"
                    required
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    placeholder="NY"
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-luxury-muted">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="10012"
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>
            </div>

            {/* Payment options selection */}
            <div className="space-y-4 pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              <h3 className="font-serif text-base font-semibold text-luxury-muted uppercase tracking-wider">Payment Method</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'STRIPE', label: 'Credit Card', icon: <CreditCard size={14} /> },
                  { id: 'RAZORPAY', label: 'Razorpay', icon: <CreditCard size={14} /> },
                  { id: 'UPI', label: 'UPI / Scan QR', icon: <QrCode size={14} /> },
                  { id: 'COD', label: 'Cash on Delivery', icon: <Truck size={14} /> },
                ].map((pay) => (
                  <button
                    key={pay.id}
                    type="button"
                    onClick={() => setPaymentMethod(pay.id as any)}
                    className={`p-3 border rounded-luxury flex flex-col items-center justify-center space-y-1.5 text-center transition-all ${
                      paymentMethod === pay.id
                        ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/5 dark:bg-luxury-gold/10'
                        : 'border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-luxury-muted'
                    }`}
                  >
                    {pay.icon}
                    <span className="text-[10px] font-bold tracking-wider">{pay.label}</span>
                  </button>
                ))}
              </div>

              {/* Conditionally rendered payment inputs */}
              <div className="bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder p-5 rounded-luxury">
                {paymentMethod === 'STRIPE' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-luxury-muted">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Julian Gray"
                        className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-luxury-muted">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-luxury-muted">Expiration Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-luxury-muted">Security Code (CVC)</label>
                        <input
                          type="text"
                          value={cardCVC}
                          onChange={(e) => setCardCVC(e.target.value)}
                          placeholder="•••"
                          className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none focus:border-luxury-gold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'RAZORPAY' && (
                  <p className="text-xs text-luxury-muted">
                    Razorpay checkout will open in a secure popup to authorize credit cards, wallets, or net banking.
                  </p>
                )}

                {paymentMethod === 'UPI' && (
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <QrCode size={120} className="text-luxury-text dark:text-white" />
                    <p className="text-[10px] text-luxury-gold tracking-widest">Scan QR using BHIM, GPAY, or PhonePe</p>
                    <div className="w-full space-y-1.5 text-left">
                      <label className="text-luxury-muted">or Enter UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okaxis"
                        className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none focus:border-luxury-gold"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'COD' && (
                  <p className="text-xs text-luxury-muted">
                    Pay with cash or card upon delivery. An additional COD fee of ₹0.00 will apply.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={orderProcessing || items.length === 0}
              className="w-full py-4 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all disabled:opacity-40"
            >
              {orderProcessing ? 'Processing Transaction...' : `Place Order • ${formatPrice(grandTotal, currency)}`}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder rounded-luxury p-6 shadow-luxury space-y-6">
            <h3 className="font-serif text-lg font-semibold border-b border-luxury-border dark:border-luxury-darkBorder pb-2">Order Summary</h3>

            {/* Items display */}
            <div className="space-y-4 overflow-y-auto max-h-[220px] no-scrollbar">
              {items.length === 0 ? (
                <p className="text-xs text-luxury-muted italic">No items in your cart.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-xs">
                    <div className="flex space-x-3">
                      <img src={item.image} alt={item.name} className="w-10 h-12 object-cover rounded-luxury border border-luxury-border dark:border-luxury-darkBorder" />
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-[10px] text-luxury-muted mt-0.5">{item.color} {item.size ? `/ Size ${item.size}` : ''}</p>
                        <p className="text-[10px] text-luxury-muted mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold">{formatPrice(item.price * item.quantity, currency)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Coupon Application input */}
            <form onSubmit={handleApplyCoupon} className="flex space-x-2 border-t border-luxury-border dark:border-luxury-darkBorder pt-4">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="PROMO CODE"
                className="bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 text-xs w-full focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 border border-luxury-text dark:border-white text-xs font-bold rounded-luxury hover:bg-luxury-gold hover:text-white transition-colors"
              >
                Apply
              </button>
            </form>
            {couponError && <p className="text-[10px] font-bold text-luxury-danger">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[10px] font-bold text-luxury-success flex items-center">
                <Check size={10} className="mr-1" /> Coupon {appliedCoupon.code} applied successfully!
              </p>
            )}

            {/* Mathematical totals */}
            <div className="border-t border-luxury-border dark:border-luxury-darkBorder pt-4 space-y-2.5 text-xs font-semibold text-luxury-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-luxury-success">
                  <span>Discount ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}%` : 'Fixed'})</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Cost</span>
                <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (8%)</span>
                <span>{formatPrice(taxAmount, currency)}</span>
              </div>
              <div className="border-t border-luxury-border dark:border-luxury-darkBorder pt-3 flex justify-between text-sm font-bold text-luxury-text dark:text-white">
                <span>Grand Total</span>
                <span>{formatPrice(grandTotal, currency)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
