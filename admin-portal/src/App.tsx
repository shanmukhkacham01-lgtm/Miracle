import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  ShoppingBag,
  Users,
  Layers,
  AlertTriangle,
  Trash2,
  Edit2,
  Plus,
  MapPin,
  Gift,
  LogOut,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// Currency formatting
const formatPrice = (priceInUSD: number) => {
  const converted = priceInUSD * 83.0;
  return `₹${converted.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'addresses' | 'users' | 'coupons' | 'categories' | 'brands'>('analytics');

  // Core Data States
  const [kpis, setKpis] = useState<any>({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [salesGraph, setSalesGraph] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [addressesList, setAddressesList] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Editors
  const [editingItem, setEditingItem] = useState<any | null>(null); // products, users, addresses, coupons, categories, brands
  const [modalType, setModalType] = useState<'product' | 'user' | 'address' | 'coupon' | 'category' | 'brand' | null>(null);
  
  // Form Inputs
  const [pName, setPName] = useState('');
  const [pPriceINR, setPPriceINR] = useState('');
  const [pCompareAtPriceINR, setPCompareAtPriceINR] = useState('');
  const [pStock, setPStock] = useState('');
  const [pSku, setPSku] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pImg, setPImg] = useState('');

  const [uEmail, setUEmail] = useState('');
  const [uFirstName, setUFirstName] = useState('');
  const [uLastName, setULastName] = useState('');
  const [uRole, setURole] = useState('USER');
  const [uPoints, setUPoints] = useState('');

  const [aUserId, setAUserId] = useState('');
  const [aStreet, setAStreet] = useState('');
  const [aCity, setACity] = useState('');
  const [aState, setAState] = useState('');
  const [aPostalCode, setAPostalCode] = useState('');
  const [aCountry, setACountry] = useState('');

  const [cCode, setCCode] = useState('');
  const [cType, setCType] = useState('PERCENTAGE');
  const [cVal, setCVal] = useState('');
  const [cMinOrderINR, setCMinOrderINR] = useState('');
  const [cExpiresAt, setCExpiresAt] = useState('');

  const [catName, setCatName] = useState('');
  const [catImg, setCatImg] = useState('');

  const [bName, setBName] = useState('');
  const [bImg, setBImg] = useState('');

  const [crudMessage, setCrudMessage] = useState('');

  // Auto Login Check
  useEffect(() => {
    const savedToken = localStorage.getItem('miracle_access_token');
    const savedRole = localStorage.getItem('miracle_user_role');
    if (savedToken && (savedRole === 'ADMIN' || savedRole === 'SUPERADMIN')) {
      setToken(savedToken);
      setRole(savedRole);
      loadAllPortalData(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed.');

      if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPERADMIN') {
        throw new Error('Access Denied. Administrator role required.');
      }

      localStorage.setItem('miracle_access_token', data.accessToken);
      localStorage.setItem('miracle_refresh_token', data.refreshToken);
      localStorage.setItem('miracle_user_role', data.user.role);

      setToken(data.accessToken);
      setRole(data.user.role);
      setUsername(`${data.user.firstName} ${data.user.lastName}`);
      loadAllPortalData(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('miracle_access_token');
    localStorage.removeItem('miracle_refresh_token');
    localStorage.removeItem('miracle_user_role');
    setToken(null);
    setRole(null);
  };

  // REST API Requests Helper
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}, activeToken = token) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeToken}`,
      ...(options.headers || {})
    };
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed.');
    return data;
  };

  const loadAllPortalData = async (activeToken: string) => {
    try {
      const analytics = await fetchWithAuth('/admin/analytics', {}, activeToken);
      setKpis(analytics.data.kpis);
      setRecentOrders(analytics.data.recentOrders || []);
      setInventoryAlerts(analytics.data.inventoryAlerts || []);
      setSalesGraph(analytics.data.salesGraph || []);

      // Use admin-only endpoints so all IDs and fields are returned
      const [categories, brands, products, orders, users, coupons, addresses] = await Promise.all([
        fetchWithAuth('/admin/categories', {}, activeToken),
        fetchWithAuth('/admin/brands', {}, activeToken),
        fetchWithAuth('/admin/products', {}, activeToken),
        fetchWithAuth('/admin/orders', {}, activeToken),
        fetchWithAuth('/admin/users', {}, activeToken),
        fetchWithAuth('/admin/coupons', {}, activeToken),
        fetchWithAuth('/admin/addresses', {}, activeToken),
      ]);

      setCategoriesList(categories.categories || []);
      setBrandsList(brands.brands || []);
      setProductsList(products.products || []);
      setOrdersList(orders.orders || []);
      setUsersList(users.users || []);
      setCouponsList(coupons.coupons || []);
      setAddressesList(addresses.addresses || []);

    } catch (err) {
      console.error('Backend server connection failed:', err);
      setCrudMessage('Error: Failed to connect to the backend database server. Please check your connection.');
    }
  };

  // Modal resets
  const openModal = (type: 'product' | 'user' | 'address' | 'coupon' | 'category' | 'brand', item: any = null) => {
    setEditingItem(item);
    setModalType(type);
    setCrudMessage('');

    if (item) {
      if (type === 'product') {
        setPName(item.name || '');
        setPPriceINR(item.price ? (item.price * 83).toFixed(2) : '');
        setPCompareAtPriceINR(item.compareAtPrice ? (item.compareAtPrice * 83).toFixed(2) : '');
        setPStock(item.stock?.toString() || '0');
        setPSku(item.sku || '');
        // Admin endpoint returns nested category/brand objects; fallback to flat ID fields
        setPCategory(item.categoryId || item.category?.id || '');
        setPBrand(item.brandId || item.brand?.id || '');
        setPDesc(item.description || '');
        setPImg(item.images?.[0] || '');
      } else if (type === 'user') {
        setUEmail(item.email || '');
        setUFirstName(item.firstName || '');
        setULastName(item.lastName || '');
        setURole(item.role || 'USER');
        setUPoints(item.points?.toString() || '0');
      } else if (type === 'address') {
        setAUserId(item.userId || '');
        setAStreet(item.street || '');
        setACity(item.city || '');
        setAState(item.state || '');
        setAPostalCode(item.postalCode || '');
        setACountry(item.country || '');
      } else if (type === 'coupon') {
        setCCode(item.code || '');
        setCType(item.discountType || 'PERCENTAGE');
        setCVal(item.discountValue?.toString() || '0');
        setCMinOrderINR(item.minOrderValue ? (item.minOrderValue * 83).toFixed(2) : '0');
        setCExpiresAt(item.expiresAt ? item.expiresAt.substring(0, 10) : '');
      } else if (type === 'category') {
        setCatName(item.name || '');
        setCatImg(item.image || '');
      } else if (type === 'brand') {
        setBName(item.name || '');
        setBImg(item.image || '');
      }
    } else {
      // Clear forms
      setPName(''); setPPriceINR(''); setPCompareAtPriceINR(''); setPStock('0'); setPSku(''); setPCategory(''); setPBrand(''); setPDesc(''); setPImg('');
      setUEmail(''); setUFirstName(''); setULastName(''); setURole('USER'); setUPoints('0');
      setAUserId(''); setAStreet(''); setACity(''); setAState(''); setAPostalCode(''); setACountry('');
      setCCode(''); setCType('PERCENTAGE'); setCVal(''); setCMinOrderINR(''); setCExpiresAt('');
      setCatName(''); setCatImg('');
      setBName(''); setBImg('');
    }
  };

  const closeModal = () => {
    setEditingItem(null);
    setModalType(null);
  };

  // Product CRUD
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudMessage('');

    const body = {
      name: pName,
      description: pDesc,
      price: parseFloat(pPriceINR) / 83.0, // convert input INR to DB USD
      compareAtPrice: pCompareAtPriceINR ? parseFloat(pCompareAtPriceINR) / 83.0 : null,
      stock: parseInt(pStock, 10),
      sku: pSku,
      categoryId: pCategory || undefined,
      brandId: pBrand || undefined,
      images: pImg ? [pImg] : [],
    };

    try {
      if (editingItem) {
        const res = await fetchWithAuth(`/admin/products/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        setProductsList(productsList.map(p => p.id === editingItem.id ? res.product : p));
        setCrudMessage('Product updated successfully.');
      } else {
        const res = await fetchWithAuth('/admin/products', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        setProductsList([res.product, ...productsList]);
        setCrudMessage('Product cataloged successfully.');
      }
      setTimeout(closeModal, 800);
    } catch (err: any) {
      setCrudMessage(err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetchWithAuth(`/admin/products/${id}`, { method: 'DELETE' });
      setProductsList(productsList.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // User CRUD
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudMessage('');
    const body = { email: uEmail, firstName: uFirstName, lastName: uLastName, role: uRole, points: parseInt(uPoints, 10) };

    try {
      const res = await fetchWithAuth(`/admin/users/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      setUsersList(usersList.map(u => u.id === editingItem.id ? res.user : u));
      setCrudMessage('User account updated successfully.');
      setTimeout(closeModal, 800);
    } catch (err: any) {
      setCrudMessage(err.message);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete user profile? This will remove all order histories associated.')) return;
    try {
      await fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' });
      setUsersList(usersList.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Address CRUD
  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudMessage('');
    const body = { userId: aUserId, street: aStreet, city: aCity, state: aState, postalCode: aPostalCode, country: aCountry };

    try {
      if (editingItem) {
        const res = await fetchWithAuth(`/admin/addresses/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        setAddressesList(addressesList.map(a => a.id === editingItem.id ? { ...res.address, user: editingItem.user } : a));
        setCrudMessage('Address updated successfully.');
      } else {
        const res = await fetchWithAuth('/admin/addresses', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        // Find matching user detail
        const matchingUser = usersList.find(u => u.id === aUserId);
        setAddressesList([{ ...res.address, user: matchingUser }, ...addressesList]);
        setCrudMessage('Address created successfully.');
      }
      setTimeout(closeModal, 800);
    } catch (err: any) {
      setCrudMessage(err.message);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await fetchWithAuth(`/admin/addresses/${id}`, { method: 'DELETE' });
      setAddressesList(addressesList.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Order Operations
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetchWithAuth(`/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setOrdersList(ordersList.map(o => o.id === orderId ? { ...o, status: res.order.status } : o));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingNumber: string) => {
    try {
      await fetchWithAuth(`/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ trackingNumber })
      });
      setOrdersList(ordersList.map(o => o.id === orderId ? { ...o, trackingNumber } : o));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Coupon CRUD
  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudMessage('');
    const body = {
      code: cCode,
      discountType: cType,
      discountValue: parseFloat(cVal),
      minOrderValue: parseFloat(cMinOrderINR) / 83.0,
      expiresAt: new Date(cExpiresAt).toISOString(),
    };

    try {
      if (editingItem) {
        const res = await fetchWithAuth(`/admin/coupons/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        setCouponsList(couponsList.map(c => c.id === editingItem.id ? res.coupon : c));
        setCrudMessage('Coupon updated.');
      } else {
        const res = await fetchWithAuth('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        setCouponsList([res.coupon, ...couponsList]);
        setCrudMessage('Coupon created.');
      }
      setTimeout(closeModal, 800);
    } catch (err: any) {
      setCrudMessage(err.message);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Remove coupon?')) return;
    try {
      await fetchWithAuth(`/admin/coupons/${id}`, { method: 'DELETE' });
      setCouponsList(couponsList.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Category CRUD
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudMessage('');
    const body = { name: catName, image: catImg };

    try {
      if (editingItem) {
        const res = await fetchWithAuth(`/admin/categories/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        setCategoriesList(categoriesList.map(c => c.id === editingItem.id ? res.category : c));
        setCrudMessage('Category updated.');
      } else {
        const res = await fetchWithAuth('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        setCategoriesList([...categoriesList, res.category]);
        setCrudMessage('Category added.');
      }
      setTimeout(closeModal, 800);
    } catch (err: any) {
      setCrudMessage(err.message);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Remove Category?')) return;
    try {
      await fetchWithAuth(`/admin/categories/${id}`, { method: 'DELETE' });
      setCategoriesList(categoriesList.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Brand CRUD
  const saveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudMessage('');
    const body = { name: bName, image: bImg };

    try {
      if (editingItem) {
        const res = await fetchWithAuth(`/admin/brands/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        setBrandsList(brandsList.map(b => b.id === editingItem.id ? res.brand : b));
        setCrudMessage('Brand updated.');
      } else {
        const res = await fetchWithAuth('/admin/brands', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        setBrandsList([...brandsList, res.brand]);
        setCrudMessage('Brand added.');
      }
      setTimeout(closeModal, 800);
    } catch (err: any) {
      setCrudMessage(err.message);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm('Remove Brand?')) return;
    try {
      await fetchWithAuth(`/admin/brands/${id}`, { method: 'DELETE' });
      setBrandsList(brandsList.filter(b => b.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Auth Gate
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-center items-center px-6 py-12">
        <div className="bg-white p-8 rounded-luxury border border-[#E8E8E8] shadow-luxury max-w-md w-full space-y-6">
          <div className="text-center space-y-2 flex flex-col items-center">
            <img
              src="/logo.jpg"
              alt="Miracle Collections Logo"
              className="w-16 h-16 rounded-full border border-[#E8E8E8] shadow-md mb-2"
            />
            <span className="font-serif text-2xl font-semibold tracking-[6px] text-[#111111] block uppercase">miracle</span>
            <span className="text-[10px] font-bold text-[#C8A97E] tracking-widest block uppercase">Admin Portal</span>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 text-[#EF4444] border border-red-100 rounded-luxury text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle size={14} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-[#666666]">Email Credentials</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@miracle.luxury"
                className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2.5 outline-none focus:border-[#C8A97E] bg-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#666666]">Security Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2.5 outline-none focus:border-[#C8A97E] bg-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
            >
              {authLoading ? 'Authorizing Secure Key...' : 'Sign In To Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter lists by Search Queries
  const filteredProducts = productsList.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers = usersList.filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredOrders = ordersList.filter(o => o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || o.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredAddresses = addressesList.filter(a => a.street?.toLowerCase().includes(searchQuery.toLowerCase()) || a.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAF8]">
      
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 bg-white border-r border-[#E8E8E8] p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="space-y-1 border-b border-[#E8E8E8] pb-4 flex items-center space-x-3">
            <img
              src="/logo.jpg"
              alt="Miracle Collections Logo"
              className="w-10 h-10 rounded-full border border-[#E8E8E8]"
            />
            <div>
              <span className="font-serif text-lg font-semibold tracking-[3px] uppercase block">miracle</span>
              <div className="flex items-center space-x-1">
                <Shield size={10} className="text-[#C8A97E]" />
                <span className="text-[8px] font-bold text-[#666666] uppercase tracking-wider">Portal Manager</span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col space-y-1 text-xs font-semibold tracking-wider text-[#666666]">
            {[
              { id: 'analytics', label: 'Analytics Panel', icon: <TrendingUp size={14} /> },
              { id: 'products', label: 'Product Catalog', icon: <Layers size={14} /> },
              { id: 'orders', label: 'Orders Hub', icon: <ShoppingBag size={14} /> },
              { id: 'addresses', label: 'Addresses Index', icon: <MapPin size={14} /> },
              { id: 'users', label: 'User Directory', icon: <Users size={14} /> },
              { id: 'coupons', label: 'Coupons & Promos', icon: <Gift size={14} /> },
              { id: 'categories', label: 'Catalog Categories', icon: <ChevronRight size={14} /> },
              { id: 'brands', label: 'Designer Brands', icon: <UserCheck size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-luxury text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#111111] text-white'
                    : 'hover:bg-[#FAFAF8] hover:text-[#C8A97E]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#E8E8E8] pt-4 space-y-3">
          <div className="text-[10px] text-[#666666] font-bold">
            <p>Signed In As Admin</p>
            <p className="text-[#C8A97E] tracking-wider mt-0.5 truncate">{username || 'Elizabeth Vance'}</p>
            <p className="text-[9px] text-[#8E8E93] font-mono mt-0.5">Role: {role || 'ADMIN'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold text-[#EF4444] hover:bg-red-50 rounded-luxury"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto no-scrollbar max-h-screen">
        
        {/* Tab: Analytics Panel */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="border-b border-[#E8E8E8] pb-4">
              <h2 className="font-serif text-2xl font-semibold">Analytics Overview</h2>
              <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">PLATFORM PERFORMANCE METRICS</p>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: formatPrice(kpis.totalRevenue), icon: <TrendingUp size={16} /> },
                { label: 'Total Orders', value: kpis.totalOrders, icon: <ShoppingBag size={16} /> },
                { label: 'Active Customers', value: kpis.totalCustomers, icon: <Users size={16} /> },
                { label: 'Catalog Size', value: kpis.totalProducts, icon: <Layers size={16} /> },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white border border-[#E8E8E8] p-6 rounded-luxury shadow-luxury flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-[#666666] tracking-wider uppercase">{kpi.label}</span>
                    <p className="text-xl font-bold font-mono text-[#111111]">{kpi.value}</p>
                  </div>
                  <div className="text-[#C8A97E] bg-[#C8A97E]/5 p-3 rounded-full">{kpi.icon}</div>
                </div>
              ))}
            </div>

            {/* Charts & Warnings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales Graph mockup */}
              <div className="lg:col-span-2 bg-white border border-[#E8E8E8] p-6 rounded-luxury space-y-4">
                <h3 className="font-serif text-lg font-semibold border-b border-[#E8E8E8] pb-2">Revenue Growth</h3>
                <div className="h-48 flex items-end justify-between pt-6 px-4">
                  {salesGraph.map((point, idx) => {
                    const maxVal = Math.max(...salesGraph.map(s => s.sales));
                    const heightPct = maxVal > 0 ? (point.sales / maxVal) * 80 : 20;
                    return (
                      <div key={idx} className="flex flex-col items-center space-y-3 flex-grow">
                        <span className="text-[9px] font-mono font-bold">{formatPrice(point.sales)}</span>
                        <div
                          className="w-8 bg-[#C8A97E] hover:bg-[#111111] rounded-t-sm transition-all duration-300"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] font-bold text-[#666666]">{point.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white border border-[#E8E8E8] p-6 rounded-luxury space-y-4">
                <div className="flex items-center space-x-2 border-b border-[#E8E8E8] pb-2">
                  <AlertTriangle size={16} className="text-[#EF4444] animate-pulse" />
                  <h3 className="font-serif text-lg font-semibold">Inventory Alerts</h3>
                </div>
                <div className="space-y-4 max-h-[220px] overflow-y-auto no-scrollbar">
                  {inventoryAlerts.length === 0 ? (
                    <p className="text-xs text-[#666666] italic py-6 text-center">All stocks within satisfactory range.</p>
                  ) : (
                    inventoryAlerts.map(alert => (
                      <div key={alert.id} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold truncate max-w-[150px]">{alert.name}</p>
                          <p className="text-[9px] text-[#666666] font-mono mt-0.5">{alert.sku}</p>
                          <p className="text-[10px] text-[#EF4444] font-bold mt-0.5">Stock: {alert.stock}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white border border-[#E8E8E8] p-6 rounded-luxury space-y-4 shadow-luxury">
              <h3 className="font-serif text-lg font-semibold border-b border-[#E8E8E8] pb-2">Recent Orders Activity</h3>
              <div className="space-y-4 max-h-[220px] overflow-y-auto no-scrollbar">
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-[#666666] italic py-6 text-center">No recent orders recorded.</p>
                ) : (
                  recentOrders.map(o => (
                    <div key={o.id} className="flex justify-between items-center text-xs border-b border-[#E8E8E8]/30 pb-2">
                      <div>
                        <p className="font-semibold text-[#111111]">{o.orderNumber}</p>
                        <p className="text-[9px] text-[#666666] font-bold uppercase mt-0.5">By: {o.user?.firstName} {o.user?.lastName} ({o.user?.email})</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#C8A97E]">{formatPrice(o.grandTotal)}</span>
                        <span className="ml-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FAFAF8] text-[#666666] uppercase">{o.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tab: Products Catalog */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E8E8E8] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Product Catalog</h2>
                <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">MANAGE MIRACLE ITEMS AND PRICES</p>
              </div>
              <button
                onClick={() => openModal('product')}
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all flex items-center space-x-2"
              >
                <Plus size={14} />
                <span>Catalog New Item</span>
              </button>
            </div>

            {/* Search Header */}
            <div className="relative flex items-center border border-[#E8E8E8] bg-white rounded-luxury px-3.5 py-2 text-xs">
              <Search size={14} className="text-[#666666] mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, SKU, or brand..."
                className="w-full bg-transparent outline-none font-semibold text-[#111111]"
              />
            </div>

            {/* Products Listing Grid */}
            <div className="bg-white border border-[#E8E8E8] rounded-luxury overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E8E8] text-[#666666] uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Price (INR)</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {filteredProducts.map(prod => (
                    <tr key={prod.id} className="hover:bg-[#FAFAF8]/50">
                      <td className="p-4 flex items-center space-x-3">
                        <img src={prod.images?.[0]} alt="" className="w-8 h-10 object-cover rounded-luxury border" />
                        <div>
                          <p className="font-bold text-[#111111]">{prod.name}</p>
                          <p className="text-[9px] text-[#666666] font-bold uppercase">{prod.brand?.name || 'Designer Studio'}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-[#666666]">{prod.sku}</td>
                      <td className="p-4">{prod.category?.name || 'General'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                          prod.stock <= 5 ? 'bg-red-50 text-[#EF4444]' : 'bg-[#FAFAF8] text-[#666666]'
                        }`}>{prod.stock} Units</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#111111]">{formatPrice(prod.price)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button onClick={() => openModal('product', prod)} className="p-1 hover:text-[#C8A97E] text-[#666666]" title="Edit Product">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteProduct(prod.id)} className="p-1 hover:text-[#EF4444] text-[#666666]" title="Delete Product">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Orders Hub */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E8E8] pb-4">
              <h2 className="font-serif text-2xl font-semibold">Orders Registry</h2>
              <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">MANAGE TRANSACTION STATUS AND TRACKING</p>
            </div>

            <div className="relative flex items-center border border-[#E8E8E8] bg-white rounded-luxury px-3.5 py-2 text-xs">
              <Search size={14} className="text-[#666666] mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by number, client email..."
                className="w-full bg-transparent outline-none font-semibold"
              />
            </div>

            <div className="bg-white border border-[#E8E8E8] rounded-luxury overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E8E8] text-[#666666] uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Order Code</th>
                    <th className="p-4">Client Detail</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Status Gate</th>
                    <th className="p-4">Courier Tracking</th>
                    <th className="p-4">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-[#FAFAF8]/50">
                      <td className="p-4 font-bold">{order.orderNumber}</td>
                      <td className="p-4">
                        <p className="font-bold">{order.user?.firstName} {order.user?.lastName}</p>
                        <p className="text-[10px] text-[#666666] font-bold">{order.user?.email}</p>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#C8A97E]">{formatPrice(order.grandTotal)}</td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="bg-[#FAFAF8] border border-[#E8E8E8] rounded-luxury px-2 py-1 outline-none text-[11px] font-bold"
                        >
                          <option value="PENDING">Pending Approval</option>
                          <option value="PAID">Paid / Processing</option>
                          <option value="SHIPPED">Shipped Out</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          defaultValue={order.trackingNumber || ''}
                          onBlur={(e) => handleUpdateTracking(order.id, e.target.value)}
                          placeholder="Add Tracking Code"
                          className="bg-transparent border-b border-transparent hover:border-[#E8E8E8] focus:border-[#C8A97E] outline-none px-1 py-0.5 text-xs font-mono w-40"
                        />
                      </td>
                      <td className="p-4">
                        <a
                          href={`${API_BASE}/orders/${order.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C8A97E] hover:text-[#111111] flex items-center space-x-1"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Addresses Index */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E8E8E8] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Addresses Directory</h2>
                <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">MANAGE ALL CLIENT ADDRESS RECORDS</p>
              </div>
              <button
                onClick={() => openModal('address')}
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all flex items-center space-x-2"
              >
                <Plus size={14} />
                <span>Create Client Address</span>
              </button>
            </div>

            <div className="relative flex items-center border border-[#E8E8E8] bg-white rounded-luxury px-3.5 py-2 text-xs">
              <Search size={14} className="text-[#666666] mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search addresses by street name or client email..."
                className="w-full bg-transparent outline-none font-semibold"
              />
            </div>

            <div className="bg-white border border-[#E8E8E8] rounded-luxury overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E8E8] text-[#666666] uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Client Detail</th>
                    <th className="p-4">Street Address</th>
                    <th className="p-4">City / State</th>
                    <th className="p-4">Postal Code</th>
                    <th className="p-4">Country</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {filteredAddresses.map(addr => (
                    <tr key={addr.id} className="hover:bg-[#FAFAF8]/50">
                      <td className="p-4">
                        <p className="font-bold">{addr.user?.firstName} {addr.user?.lastName}</p>
                        <p className="text-[10px] text-[#666666] font-bold">{addr.user?.email}</p>
                      </td>
                      <td className="p-4 font-mono text-[11px]">{addr.street}</td>
                      <td className="p-4">{addr.city}, {addr.state}</td>
                      <td className="p-4 font-mono">{addr.postalCode}</td>
                      <td className="p-4">{addr.country}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button onClick={() => openModal('address', addr)} className="p-1 hover:text-[#C8A97E] text-[#666666]" title="Edit Address">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteAddress(addr.id)} className="p-1 hover:text-[#EF4444] text-[#666666]" title="Delete Address">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: User Directory */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E8E8] pb-4">
              <h2 className="font-serif text-2xl font-semibold">User Management Directory</h2>
              <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">MANAGE ROLES, LOYALTY POINTS AND DETAILS</p>
            </div>

            <div className="relative flex items-center border border-[#E8E8E8] bg-white rounded-luxury px-3.5 py-2 text-xs">
              <Search size={14} className="text-[#666666] mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user registry by name, email..."
                className="w-full bg-transparent outline-none font-semibold"
              />
            </div>

            <div className="bg-white border border-[#E8E8E8] rounded-luxury overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E8E8] text-[#666666] uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">System Role</th>
                    <th className="p-4">Loyalty Points</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[#FAFAF8]/50">
                      <td className="p-4 font-bold text-[#111111]">{u.firstName} {u.lastName}</td>
                      <td className="p-4 font-mono text-[10px] text-[#666666]">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                          u.role === 'ADMIN' || u.role === 'SUPERADMIN' ? 'bg-[#C8A97E]/10 text-[#C8A97E]' : 'bg-[#FAFAF8] text-[#666666]'
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-4 font-mono text-bold text-[#111111]">{u.points} pts</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button onClick={() => openModal('user', u)} className="p-1 hover:text-[#C8A97E] text-[#666666]" title="Edit Account">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="p-1 hover:text-[#EF4444] text-[#666666]" title="Delete Account">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Coupons & Promos */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E8E8E8] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Coupon campaigns</h2>
                <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">MANAGE PROMOTIONAL AND LOYALTY CODES</p>
              </div>
              <button
                onClick={() => openModal('coupon')}
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all flex items-center space-x-2"
              >
                <Plus size={14} />
                <span>Create Promo Code</span>
              </button>
            </div>

            <div className="bg-white border border-[#E8E8E8] rounded-luxury overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E8E8] text-[#666666] uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Promo Code</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Benefit / Discount</th>
                    <th className="p-4">Minimum Order</th>
                    <th className="p-4">Expiration Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {couponsList.map(cp => (
                    <tr key={cp.id} className="hover:bg-[#FAFAF8]/50">
                      <td className="p-4 font-mono font-bold tracking-widest text-[#111111]">{cp.code}</td>
                      <td className="p-4 font-bold">{cp.discountType}</td>
                      <td className="p-4 text-[#C8A97E]">
                        {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}% Off` : `${formatPrice(cp.discountValue)} Off`}
                      </td>
                      <td className="p-4 font-mono">{cp.minOrderValue ? formatPrice(cp.minOrderValue) : '₹0.00'}</td>
                      <td className="p-4 font-mono text-[#666666]">{new Date(cp.expiresAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button onClick={() => openModal('coupon', cp)} className="p-1 hover:text-[#C8A97E] text-[#666666]" title="Edit Coupon">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteCoupon(cp.id)} className="p-1 hover:text-[#EF4444] text-[#666666]" title="Delete Coupon">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Categories */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E8E8E8] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Catalog Categories</h2>
                <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">MANAGE STORE TAXONOMY</p>
              </div>
              <button
                onClick={() => openModal('category')}
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all flex items-center space-x-2"
              >
                <Plus size={14} />
                <span>Add Category</span>
              </button>
            </div>

            <div className="bg-white border border-[#E8E8E8] rounded-luxury overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E8E8] text-[#666666] uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Category Detail</th>
                    <th className="p-4">Slug ID</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {categoriesList.map(c => (
                    <tr key={c.id} className="hover:bg-[#FAFAF8]/50">
                      <td className="p-4 flex items-center space-x-3">
                        <img src={c.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400'} alt="" className="w-8 h-8 object-cover rounded-full border border-[#E8E8E8]" />
                        <span className="font-bold text-[#111111]">{c.name}</span>
                      </td>
                      <td className="p-4 font-mono text-[#666666]">{c.slug}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button onClick={() => openModal('category', c)} className="p-1 hover:text-[#C8A97E] text-[#666666]" title="Edit Category">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteCategory(c.id)} className="p-1 hover:text-[#EF4444] text-[#666666]" title="Delete Category">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Brands */}
        {activeTab === 'brands' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E8E8E8] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Designer Brands</h2>
                <p className="text-[10px] text-[#666666] font-semibold tracking-wider mt-0.5">MANAGE DESIGNER AND COUTURIER HOUSES</p>
              </div>
              <button
                onClick={() => openModal('brand')}
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all flex items-center space-x-2"
              >
                <Plus size={14} />
                <span>Add Designer House</span>
              </button>
            </div>

            <div className="bg-white border border-[#E8E8E8] rounded-luxury overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E8E8] text-[#666666] uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Brand Details</th>
                    <th className="p-4">Slug ID</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {brandsList.map(b => (
                    <tr key={b.id} className="hover:bg-[#FAFAF8]/50">
                      <td className="p-4 flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-full border bg-luxury-gold/5 text-luxury-gold flex items-center justify-center font-serif font-bold text-xs uppercase">
                          {b.name?.[0]}
                        </span>
                        <span className="font-bold text-[#111111]">{b.name}</span>
                      </td>
                      <td className="p-4 font-mono text-[#666666]">{b.slug}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button onClick={() => openModal('brand', b)} className="p-1 hover:text-[#C8A97E] text-[#666666]" title="Edit Brand">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteBrand(b.id)} className="p-1 hover:text-[#EF4444] text-[#666666]" title="Delete Brand">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {/* Admin Footer */}
          <footer className="border-t border-[#E8E8E8] pt-6 mt-12 flex flex-col md:flex-row justify-between items-center text-[10px] text-[#666666] tracking-wider font-semibold space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <a href="tel:9346277009" className="hover:text-[#C8A97E] flex items-center space-x-1.5">
                <svg className="w-3.5 h-3.5 text-[#C8A97E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>+91 93462 77009</span>
              </a>
              <a href="mailto:miraclecollections581@gmail.com" className="hover:text-[#C8A97E] flex items-center space-x-1.5">
                <svg className="w-3.5 h-3.5 text-[#C8A97E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>miraclecollections581@gmail.com</span>
              </a>
              <a href="https://share.google/mRgXdrLpcYVrEMNZT" target="_blank" rel="noopener noreferrer" className="hover:text-[#C8A97E] flex items-center space-x-1.5">
                <MapPin size={12} className="text-[#C8A97E]" />
                <span>Store Location</span>
              </a>
            </div>

            <div className="flex items-center space-x-4">
              {/* WhatsApp */}
              <a href="https://chat.whatsapp.com/C4XWYqZ3shP8bWGHawr944?s=cl&p=a&ilr=0" target="_blank" rel="noopener noreferrer" className="hover:text-[#C8A97E] transition-colors" title="WhatsApp">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.59 2.028 14.108.995 11.5.993 6.066.993 1.646 5.363 1.642 10.793c-.001 1.64.499 3.24 1.448 4.82l-.999 3.648 3.737-.978z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=108ys3ua" target="_blank" rel="noopener noreferrer" className="hover:text-[#C8A97E]" title="Instagram">
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/share/1BtTzur1wx/" target="_blank" rel="noopener noreferrer" className="hover:text-[#C8A97E]" title="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              {/* Youtube */}
              <a href="https://youtube.com/@miraclecollections-b1f?si=CCu3-v-ZvekkVJUZ" target="_blank" rel="noopener noreferrer" className="hover:text-[#C8A97E]" title="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.53 12 3.53 12 3.53s-7.53 0-9.388.525A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.47 12 20.47 12 20.47s7.53 0 9.388-.525a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837z"/>
                </svg>
              </a>
            </div>
          </footer>

      </main>

      {/* MODALS WINDOWS & POPUP EDITORS */}
      {modalType && (
        <div className="fixed inset-0 bg-[#111111]/30 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-[#E8E8E8] rounded-luxury shadow-luxury p-8 w-full max-w-lg space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-[#666666] hover:text-[#111111]" title="Close Panel">
              <X size={18} />
            </button>

            <div className="border-b border-[#E8E8E8] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#111111]">
                {editingItem ? 'Edit Configuration' : 'Catalog New Entity'}
              </h3>
              <p className="text-[10px] text-[#666666] tracking-wider uppercase font-semibold mt-0.5">
                {modalType} DETAILS
              </p>
            </div>

            {crudMessage && <p className="text-xs font-bold text-[#C8A97E]">{crudMessage}</p>}

            {/* Form: Product */}
            {modalType === 'product' && (
              <form onSubmit={saveProduct} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Product Title</label>
                  <input
                    type="text" required value={pName} onChange={e => setPName(e.target.value)}
                    placeholder="Classic Cashmere Overcoat"
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Price (INR)</label>
                    <input
                      type="number" required step="0.01" value={pPriceINR} onChange={e => setPPriceINR(e.target.value)}
                      placeholder="48000.00"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Compare-At Price (INR)</label>
                    <input
                      type="number" step="0.01" value={pCompareAtPriceINR} onChange={e => setPCompareAtPriceINR(e.target.value)}
                      placeholder="54000.00"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Stock Quantity</label>
                    <input
                      type="number" required value={pStock} onChange={e => setPStock(e.target.value)}
                      placeholder="15"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">SKU Reference</label>
                    <input
                      type="text" required value={pSku} onChange={e => setPSku(e.target.value)}
                      placeholder="MRC-CSH-COAT-01"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Category</label>
                    <select
                      value={pCategory} onChange={e => setPCategory(e.target.value)} required
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    >
                      <option value="">Select Category</option>
                      {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Brand</label>
                    <select
                      value={pBrand} onChange={e => setPBrand(e.target.value)} required
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    >
                      <option value="">Select Brand</option>
                      {brandsList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#666666]">Image URL</label>
                  <input
                    type="text" value={pImg} onChange={e => setPImg(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#666666]">Product Description</label>
                  <textarea
                    required rows={3} value={pDesc} onChange={e => setPDesc(e.target.value)}
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
                >
                  Save Product details
                </button>
              </form>
            )}

            {/* Form: User */}
            {modalType === 'user' && (
              <form onSubmit={saveUser} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Email Address</label>
                  <input
                    type="email" required value={uEmail} onChange={e => setUEmail(e.target.value)}
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">First Name</label>
                    <input
                      type="text" required value={uFirstName} onChange={e => setUFirstName(e.target.value)}
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Last Name</label>
                    <input
                      type="text" required value={uLastName} onChange={e => setULastName(e.target.value)}
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">System Role</label>
                    <select
                      value={uRole} onChange={e => setURole(e.target.value)}
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    >
                      <option value="USER">USER / CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Loyalty Points</label>
                    <input
                      type="number" required value={uPoints} onChange={e => setUPoints(e.target.value)}
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
                >
                  Save User Details
                </button>
              </form>
            )}

            {/* Form: Address */}
            {modalType === 'address' && (
              <form onSubmit={saveAddress} className="space-y-4 text-xs font-semibold">
                {!editingItem && (
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Target Customer Account</label>
                    <select
                      value={aUserId} onChange={e => setAUserId(e.target.value)} required
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    >
                      <option value="">Select User Profile</option>
                      {usersList.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Street Address</label>
                  <input
                    type="text" required value={aStreet} onChange={e => setAStreet(e.target.value)}
                    placeholder="452 Mercer Street, Apt 3B"
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">City</label>
                    <input
                      type="text" required value={aCity} onChange={e => setACity(e.target.value)}
                      placeholder="New York"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">State / Region</label>
                    <input
                      type="text" required value={aState} onChange={e => setAState(e.target.value)}
                      placeholder="NY"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Postal Code</label>
                    <input
                      type="text" required value={aPostalCode} onChange={e => setAPostalCode(e.target.value)}
                      placeholder="10012"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Country</label>
                    <input
                      type="text" required value={aCountry} onChange={e => setACountry(e.target.value)}
                      placeholder="United States"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
                >
                  Save Address Registry
                </button>
              </form>
            )}

            {/* Form: Coupon */}
            {modalType === 'coupon' && (
              <form onSubmit={saveCoupon} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Promo Code</label>
                    <input
                      type="text" required value={cCode} onChange={e => setCCode(e.target.value)}
                      placeholder="LUXURY20"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Discount Type</label>
                    <select
                      value={cType} onChange={e => setCType(e.target.value)}
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                    >
                      <option value="PERCENTAGE">% Percentage Off</option>
                      <option value="FIXED">Flat Amount Off</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Discount Value</label>
                    <input
                      type="number" required value={cVal} onChange={e => setCVal(e.target.value)}
                      placeholder="20"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#666666]">Min Purchase Threshold (INR)</label>
                    <input
                      type="number" required value={cMinOrderINR} onChange={e => setCMinOrderINR(e.target.value)}
                      placeholder="24900"
                      className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Expiration Date</label>
                  <input
                    type="date" required value={cExpiresAt} onChange={e => setCExpiresAt(e.target.value)}
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
                >
                  Save Coupon campaign
                </button>
              </form>
            )}

            {/* Form: Category */}
            {modalType === 'category' && (
              <form onSubmit={saveCategory} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Category Name</label>
                  <input
                    type="text" required value={catName} onChange={e => setCatName(e.target.value)}
                    placeholder="Womenswear"
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Category Image URL</label>
                  <input
                    type="text" value={catImg} onChange={e => setCatImg(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
                >
                  Save Category details
                </button>
              </form>
            )}

            {/* Form: Brand */}
            {modalType === 'brand' && (
              <form onSubmit={saveBrand} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Brand / Studio Name</label>
                  <input
                    type="text" required value={bName} onChange={e => setBName(e.target.value)}
                    placeholder="COS"
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#666666]">Studio Logo URL</label>
                  <input
                    type="text" value={bImg} onChange={e => setBImg(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-[#E8E8E8] rounded-luxury px-3 py-2 outline-none bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-[#C8A97E] text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
                >
                  Save Designer details
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Watermark Logo */}
      <div className="fixed bottom-6 right-6 z-30 pointer-events-none opacity-25 select-none">
        <img
          src="/logo.jpg"
          alt="Miracle Collections Watermark"
          className="w-10 h-10 rounded-full border border-[#E8E8E8] shadow-md"
        />
      </div>

    </div>
  );
}
