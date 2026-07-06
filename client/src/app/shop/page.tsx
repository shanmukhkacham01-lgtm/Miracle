'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../utils/api';
import ProductCard from '../../components/ProductCard';
import { Filter, Grid, List, Search, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter States
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [selectedColor, setSelectedColor] = useState(searchParams.get('color') || '');
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || '');
  const [discount, setDiscount] = useState(searchParams.get('discount') === 'true');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(1);

  // Layout View
  const [isGridView, setIsGridView] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<{ categories: any[]; brands: any[] }>({ categories: [], brands: [] });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Static Fallback Seed Data (for offline mode)
  const seedProducts: any[] = [
    { id: '1', name: 'Classic Cashmere Overcoat', slug: 'classic-cashmere-overcoat', price: 580, compareAtPrice: 720, rating: 4.8, category: { name: 'Fashion', slug: 'fashion' }, brand: { name: 'COS', slug: 'cos' }, images: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800'], attributes: { colors: ['Beige', 'Black'], sizes: ['S', 'M', 'L'] } },
    { id: '2', name: 'Silk Ribbed Knit Cardigan', slug: 'silk-ribbed-knit-cardigan', price: 290, compareAtPrice: null, rating: 4.6, category: { name: 'Fashion', slug: 'fashion' }, brand: { name: 'COS', slug: 'cos' }, images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800'], attributes: { colors: ['Oatmeal', 'Sage'], sizes: ['S', 'M'] } },
    { id: '3', name: 'Miracle Sound ANC Headphones', slug: 'miracle-sound-headphones', price: 399, compareAtPrice: 450, rating: 4.9, category: { name: 'Electronics', slug: 'electronics' }, brand: { name: 'Apple', slug: 'apple' }, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800'], attributes: { colors: ['Space Grey', 'Chalk White'], sizes: ['One Size'] } },
    { id: '4', name: 'Botanical Face Oil', slug: 'botanical-face-oil', price: 85, compareAtPrice: null, rating: 4.7, category: { name: 'Beauty', slug: 'beauty' }, brand: { name: 'Aesop', slug: 'aesop' }, images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800'], attributes: { colors: ['Glass Amber'], sizes: ['50ml'] } },
    { id: '5', name: 'Minimalist Leather Trainer', slug: 'minimalist-leather-trainer', price: 240, compareAtPrice: 280, rating: 4.5, category: { name: 'Footwear', slug: 'footwear' }, brand: { name: 'Nike Lab', slug: 'nike-lab' }, images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800'], attributes: { colors: ['White', 'Black'], sizes: ['US 9', 'US 10'] } },
    { id: '6', name: 'Signature Leather Tote', slug: 'signature-leather-tote', price: 450, compareAtPrice: null, rating: 4.9, category: { name: 'Accessories', slug: 'accessories' }, brand: { name: 'MIRACLE Studio', slug: 'miracle-studio' }, images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800'], attributes: { colors: ['Tan', 'Black'], sizes: ['Standard'] } },
    { id: '7', name: 'Ceramic Candle Ensemble', slug: 'ceramic-candle-ensemble', price: 95, compareAtPrice: 120, rating: 4.4, category: { name: 'Home & Decor', slug: 'home' }, brand: { name: 'MIRACLE Studio', slug: 'miracle-studio' }, images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800'], attributes: { colors: ['Grey Glaze'], sizes: ['Pack of 3'] } },
  ];

  // Fetch Category/Brand List
  useEffect(() => {
    async function loadMeta() {
      try {
        const { data } = await api.get('/products/metadata');
        setMetadata(data);
      } catch {
        setMetadata({
          categories: [
            { name: 'Men Section', slug: 'men-section' },
            { name: 'Women Section', slug: 'women-section' },
            { name: 'Kids Section', slug: 'kids-section' },
            { name: 'Foot Wear Section', slug: 'foot-wear-section' },
          ],
          brands: [
            { name: 'COS', slug: 'cos' },
            { name: 'Nike Lab', slug: 'nike-lab' },
            { name: 'Apple', slug: 'apple' },
            { name: 'Aesop', slug: 'aesop' },
            { name: 'MIRACLE Studio', slug: 'miracle-studio' },
          ],
        });
      }
    }
    loadMeta();
  }, []);

  // Main Products Fetching
  useEffect(() => {
    async function fetchProductsList() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (brand) params.append('brand', brand);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (rating) params.append('rating', rating);
      if (selectedColor) params.append('color', selectedColor);
      if (selectedSize) params.append('size', selectedSize);
      if (discount) params.append('discount', 'true');
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);
      params.append('page', page.toString());
      params.append('limit', '8');

      // Update URL silently
      const queryStr = params.toString();
      window.history.pushState(null, '', `?${queryStr}`);

      try {
        const { data } = await api.get(`/products?${queryStr}`);
        setProducts(data.products || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.warn('Backend server offline. Running client-side mock filtering.');
        // Perform client-side filter of seed items
        let filtered = [...seedProducts];

        if (category) filtered = filtered.filter((p) => p.category.slug === category);
        if (brand) filtered = filtered.filter((p) => p.brand.slug === brand);
        if (minPrice) filtered = filtered.filter((p) => p.price >= parseFloat(minPrice));
        if (maxPrice) filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice));
        if (rating) filtered = filtered.filter((p) => p.rating >= parseFloat(rating));
        if (discount) filtered = filtered.filter((p) => p.compareAtPrice !== null && p.compareAtPrice > p.price);
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        }

        // Sorting
        if (sort === 'price-low') {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-high') {
          filtered.sort((a, b) => b.price - a.price);
        } else if (sort === 'popular') {
          filtered.sort((a, b) => b.rating - a.rating);
        }

        setProducts(filtered);
        setTotalCount(filtered.length);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }

    fetchProductsList();
  }, [category, brand, minPrice, maxPrice, rating, selectedColor, selectedSize, discount, search, sort, page]);

  const resetFilters = () => {
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSelectedColor('');
    setSelectedSize('');
    setDiscount(false);
    setSearch('');
    setPage(1);
  };

  const colorsList = ['Beige', 'Black', 'White', 'Oatmeal', 'Sage', 'Grey Glaze', 'Glass Amber', 'Taupe'];
  const sizesList = ['XS', 'S', 'M', 'L', 'XL', 'US 9', 'US 10', 'US 11', '50ml', 'Standard'];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="flex flex-col space-y-6">
        
        {/* Title & Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 border-b border-luxury-border dark:border-luxury-darkBorder pb-5">
          <div>
            <h1 className="font-serif text-3xl font-semibold">Shop Catalog</h1>
            <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted mt-1">
              Acquire luxury essentials with structural forms. {totalCount} items found.
            </p>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 border border-luxury-border dark:border-luxury-darkBorder rounded-luxury text-xs font-semibold hover:text-luxury-gold transition-colors"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
            </button>

            <div className="flex items-center space-x-4">
              {/* Grid Toggle */}
              <div className="flex border border-luxury-border dark:border-luxury-darkBorder rounded-luxury overflow-hidden">
                <button
                  onClick={() => setIsGridView(true)}
                  className={`p-1.5 ${isGridView ? 'bg-luxury-text text-white' : 'hover:text-luxury-gold'}`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setIsGridView(false)}
                  className={`p-1.5 ${!isGridView ? 'bg-luxury-text text-white' : 'hover:text-luxury-gold'}`}
                >
                  <List size={14} />
                </button>
              </div>

              {/* Sorting */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="popular">Customer Favorites</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block space-y-8 pr-4 border-r border-luxury-border/60 dark:border-luxury-darkBorder/60">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold tracking-widest">Filter Settings</span>
              <button
                onClick={resetFilters}
                className="text-[10px] font-bold tracking-wider text-luxury-gold hover:text-luxury-text dark:hover:text-white flex items-center space-x-1"
              >
                <RotateCcw size={10} />
                <span>Reset</span>
              </button>
            </div>

            {/* Search Input inside sidebar */}
            <div className="relative border-b border-luxury-border dark:border-luxury-darkBorder pb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collection..."
                className="w-full bg-transparent text-xs outline-none py-1.5 pl-6"
              />
              <Search size={14} className="absolute left-0 top-2.5 text-luxury-muted" />
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider">Category</h4>
              <div className="space-y-2">
                {metadata.categories.map((cat) => (
                  <label key={cat.slug} className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={category === cat.slug}
                      onChange={() => setCategory(cat.slug)}
                      className="accent-luxury-gold"
                    />
                    <span className={category === cat.slug ? 'text-luxury-gold' : ''}>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-3 pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              <h4 className="text-xs font-bold uppercase tracking-wider">Brand</h4>
              <div className="space-y-2">
                {metadata.brands.map((br) => (
                  <label key={br.slug} className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="brand"
                      checked={brand === br.slug}
                      onChange={() => setBrand(br.slug)}
                      className="accent-luxury-gold"
                    />
                    <span className={brand === br.slug ? 'text-luxury-gold' : ''}>{br.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider Input fields */}
            <div className="space-y-3 pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              <h4 className="text-xs font-bold uppercase tracking-wider">Price Range</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-2 py-1 text-xs focus:outline-none"
                />
                <span className="text-luxury-muted">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-2 py-1 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Color selection */}
            <div className="space-y-3 pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              <h4 className="text-xs font-bold uppercase tracking-wider">Color</h4>
              <div className="flex flex-wrap gap-1.5">
                {colorsList.map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColor(selectedColor === col ? '' : col)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase border rounded-luxury transition-all ${
                      selectedColor === col
                        ? 'bg-luxury-text dark:bg-white text-white dark:text-luxury-text border-luxury-text dark:border-white'
                        : 'border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-luxury-muted'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes selection */}
            <div className="space-y-3 pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              <h4 className="text-xs font-bold uppercase tracking-wider">Size</h4>
              <div className="flex flex-wrap gap-1.5">
                {sizesList.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                    className={`px-2.5 py-1 text-[10px] font-bold border rounded-luxury transition-all ${
                      selectedSize === sz
                        ? 'bg-luxury-text dark:bg-white text-white dark:text-luxury-text border-luxury-text dark:border-white'
                        : 'border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-luxury-muted'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Discounts */}
            <div className="pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={discount}
                  onChange={(e) => setDiscount(e.target.checked)}
                  className="accent-luxury-gold"
                />
                <span>Private Offers / Discounted</span>
              </label>
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <main className="lg:col-span-3 space-y-10">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="space-y-4 animate-pulse">
                    <div className="aspect-[3/4] bg-luxury-border dark:bg-luxury-darkBorder rounded-luxury" />
                    <div className="h-4 bg-luxury-border dark:bg-luxury-darkBorder w-2/3 rounded-sm" />
                    <div className="h-3 bg-luxury-border dark:bg-luxury-darkBorder w-1/3 rounded-sm" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-luxury-border dark:border-luxury-darkBorder rounded-luxury space-y-4">
                <p className="font-serif text-lg text-luxury-muted">No items matched your search criteria.</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-luxury-text text-white text-xs font-bold tracking-widest rounded-luxury hover:bg-luxury-gold transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  isGridView
                    ? 'grid grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'flex flex-col space-y-6'
                }
              >
                {products.map((item) => (
                  <div key={item.id} className={!isGridView ? 'w-full max-w-2xl' : ''}>
                    <ProductCard product={item} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="border-t border-luxury-border dark:border-luxury-darkBorder pt-6 flex justify-between items-center text-xs font-semibold">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="flex items-center space-x-1 hover:text-luxury-gold disabled:opacity-30 disabled:hover:text-inherit"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                
                <span className="text-luxury-muted">Page {page} of {totalPages}</span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="flex items-center space-x-1 hover:text-luxury-gold disabled:opacity-30 disabled:hover:text-inherit"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-xs font-semibold tracking-widest text-luxury-muted uppercase">
        Loading collections...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
