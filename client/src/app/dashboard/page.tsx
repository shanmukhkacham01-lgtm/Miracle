'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../utils/api';
import { formatPrice } from '../../store/cartSlice';
import { User, ShoppingBag, MapPin, Gift, LogOut, Check, ChevronRight, CornerDownLeft, AlertCircle, Shield } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'rewards'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile forms
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  // Fallback Seeds (Offline support)
  const seedProfile = {
    firstName: 'Julian',
    lastName: 'Gray',
    email: 'user@miracle.luxury',
    points: 120,
    referralCode: 'MRC-USER77',
    addresses: [
      { id: '1', street: '452 Mercer Street, Apt 3B', city: 'New York', state: 'NY', postalCode: '10012', country: 'United States' },
    ],
  };

  const seedOrders = [
    {
      id: 'ord_1',
      orderNumber: 'MRL-88392-10',
      createdAt: new Date().toISOString(),
      grandTotal: 690.0,
      status: 'SHIPPED',
      trackingNumber: '1Z999AA10123456784',
      items: [
        { product: { name: 'Classic Cashmere Overcoat', images: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800'] }, quantity: 1, price: 580.0 },
      ],
    },
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await api.get('/auth/profile');
        setProfile(data.user);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);

        const ordersRes = await api.get('/orders');
        setOrders(ordersRes.data.orders || []);
      } catch (err) {
        console.warn('Backend server offline. Loading dashboard mock fallbacks.');
        setProfile(seedProfile);
        setFirstName(seedProfile.firstName);
        setLastName(seedProfile.lastName);
        setOrders(seedOrders);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    try {
      const { data } = await api.put('/auth/profile', { firstName, lastName });
      setProfile((prev: any) => ({ ...prev, firstName: data.user.firstName, lastName: data.user.lastName }));
      setProfileMessage('Profile updated successfully.');
    } catch {
      setProfile((prev: any) => ({ ...prev, firstName, lastName }));
      setProfileMessage('Mock profile update successful.');
    }
  };

  const handleReturn = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/return`);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'REFUNDED' } : o));
    } catch {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'REFUNDED' } : o));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('miracle_access_token');
    localStorage.removeItem('miracle_refresh_token');
    localStorage.removeItem('miracle_user_role');
    router.push('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const getOrderStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'PAID': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 4; // REFUNDED / CANCELLED
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 animate-pulse space-y-8">
        <div className="h-6 w-24 bg-luxury-border rounded-sm" />
        <div className="h-48 bg-luxury-border rounded-luxury" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 border border-luxury-border dark:border-luxury-darkBorder rounded-luxury bg-white dark:bg-luxury-darkCard p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-semibold">{profile.firstName} {profile.lastName}</h2>
            <p className="text-[10px] text-luxury-muted tracking-wider font-semibold">{profile.email}</p>
          </div>

          <nav className="flex flex-col space-y-2 text-xs font-semibold tracking-wider">
            {[
              { id: 'profile', label: 'My Profile', icon: <User size={14} /> },
              { id: 'orders', label: 'Order History', icon: <ShoppingBag size={14} /> },
              { id: 'addresses', label: 'Address Book', icon: <MapPin size={14} /> },
              { id: 'rewards', label: 'Rewards & Referrals', icon: <Gift size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-luxury text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-luxury-text dark:bg-white text-white dark:text-luxury-text'
                    : 'hover:bg-luxury-bg dark:hover:bg-luxury-darkBg hover:text-luxury-gold'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            {(profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN' || localStorage.getItem('miracle_user_role') === 'ADMIN' || localStorage.getItem('miracle_user_role') === 'SUPERADMIN') && (
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-3 py-2 text-left text-luxury-gold hover:bg-luxury-gold/5 rounded-luxury border border-luxury-gold/20 font-bold transition-all"
              >
                <Shield size={14} />
                <span>Admin Console</span>
              </a>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 text-left text-luxury-danger hover:bg-luxury-danger/5 rounded-luxury"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Dashboard Panels */}
        <main className="lg:col-span-9 bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder rounded-luxury p-6 min-h-[400px]">
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-semibold border-b border-luxury-border dark:border-luxury-darkBorder pb-2">Profile Settings</h3>

              {profileMessage && <p className="text-xs font-bold text-luxury-success">{profileMessage}</p>}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-luxury-muted">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-luxury-muted">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none focus:border-luxury-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 opacity-60">
                  <label className="text-luxury-muted">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 outline-none cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-semibold border-b border-luxury-border dark:border-luxury-darkBorder pb-2">Order History</h3>

              {orders.length === 0 ? (
                <p className="text-xs text-luxury-muted italic py-6">No order logs found. Explore our shop to place your first order.</p>
              ) : (
                <div className="space-y-8">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-luxury-border dark:border-luxury-darkBorder rounded-luxury p-5 space-y-4">
                      
                      {/* Header details */}
                      <div className="flex flex-wrap justify-between items-baseline gap-2 text-xs">
                        <div>
                          <p className="font-bold">Order #{order.orderNumber}</p>
                          <p className="text-[10px] text-luxury-muted font-bold mt-0.5">PLACED ON: {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="font-bold text-luxury-gold">Total Amount: {formatPrice(order.grandTotal)}</p>
                          {order.trackingNumber && <p className="text-[10px] text-luxury-muted font-bold mt-0.5">TRACKING: {order.trackingNumber}</p>}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center space-x-3">
                              {item.product.images?.[0] && (
                                <img src={item.product.images[0]} alt={item.product.name} className="w-10 h-12 object-cover rounded-luxury" />
                              )}
                              <div>
                                <p className="font-semibold">{item.product.name}</p>
                                <p className="text-[10px] text-luxury-muted mt-0.5">Quantity: {item.quantity} @ {formatPrice(item.price)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Stepper tracking progress */}
                      {order.status !== 'REFUNDED' && order.status !== 'CANCELLED' ? (
                        <div className="pt-2">
                          <div className="flex justify-between text-[9px] font-bold text-luxury-muted tracking-wider mb-2">
                            <span className={getOrderStatusStep(order.status) >= 1 ? 'text-luxury-gold' : ''}>Placed</span>
                            <span className={getOrderStatusStep(order.status) >= 2 ? 'text-luxury-gold' : ''}>Paid</span>
                            <span className={getOrderStatusStep(order.status) >= 3 ? 'text-luxury-gold' : ''}>Shipped</span>
                            <span className={getOrderStatusStep(order.status) >= 4 ? 'text-luxury-gold' : ''}>Delivered</span>
                          </div>
                          
                          {/* Progress Line */}
                          <div className="relative w-full h-1 bg-luxury-border dark:bg-luxury-darkBorder rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-luxury-gold transition-all duration-500"
                              style={{ width: `${(getOrderStatusStep(order.status) / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-luxury-danger/10 text-luxury-danger border border-luxury-danger/20 rounded-luxury text-xs font-semibold flex items-center space-x-1.5">
                          <AlertCircle size={14} />
                          <span>This order has been returned/refunded.</span>
                        </div>
                      )}

                      {/* Download Invoice & Return actions */}
                      <div className="pt-2 flex justify-between border-t border-luxury-border/50 dark:border-luxury-darkBorder/50">
                        <a
                          href={`http://localhost:5000/api/orders/${order.id}/invoice`}
                          download
                          className="text-[10px] font-bold text-luxury-gold hover:text-luxury-text flex items-center"
                        >
                          Invoice PDF
                        </a>
                        {order.status === 'DELIVERED' && (
                          <button
                            onClick={() => handleReturn(order.id)}
                            className="text-[10px] font-bold text-luxury-danger hover:underline flex items-center space-x-1"
                          >
                            <CornerDownLeft size={10} />
                            <span>Return Item</span>
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-semibold border-b border-luxury-border dark:border-luxury-darkBorder pb-2">Address Book</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.addresses.map((addr: any) => (
                  <div key={addr.id} className="border border-luxury-border dark:border-luxury-darkBorder rounded-luxury p-5 space-y-2 text-xs">
                    <p className="font-bold flex items-center space-x-1">
                      <MapPin size={12} className="text-luxury-gold" />
                      <span>Primary Billing Address</span>
                    </p>
                    <div className="text-luxury-muted dark:text-luxury-darkMuted leading-relaxed pt-1.5">
                      <p>{addr.street}</p>
                      <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p>{addr.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewards & Referrals Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-semibold border-b border-luxury-border dark:border-luxury-darkBorder pb-2">Loyalty &amp; Referrals</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Points ledger */}
                <div className="bg-luxury-bg dark:bg-luxury-darkBg border border-luxury-border dark:border-luxury-darkBorder p-6 rounded-luxury text-center space-y-2">
                  <span className="text-[10px] font-bold text-luxury-gold tracking-widest block">Available Balance</span>
                  <span className="text-3xl font-bold font-mono text-luxury-text dark:text-white">{profile.points}</span>
                  <span className="text-[10px] text-luxury-muted font-semibold tracking-wider block">Miracle Points</span>
                  <p className="text-[10px] text-luxury-muted leading-relaxed pt-2">
                    Points can be redeemed at checkout for discounts. 100 points = ₹800 off.
                  </p>
                </div>

                {/* Referral codes */}
                <div className="border border-luxury-border dark:border-luxury-darkBorder p-6 rounded-luxury space-y-4">
                  <h4 className="font-serif text-base font-semibold">Invite Friends</h4>
                  <p className="text-xs text-luxury-muted leading-relaxed">
                    Share your referral code. They receive 50 additional welcome points, and you receive 100 points when they sign up!
                  </p>
                  <div className="bg-white dark:bg-luxury-darkBg border border-luxury-border dark:border-luxury-darkBorder p-2.5 rounded-luxury text-center font-mono text-xs font-bold tracking-widest border-dashed select-all">
                    {profile.referralCode}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
