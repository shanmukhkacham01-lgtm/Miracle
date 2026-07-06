'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([
    { name: 'Men Section', slug: 'men-section', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600' },
    { name: 'Women Section', slug: 'women-section', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600' },
    { name: 'Kids Section', slug: 'kids-section', image: 'https://images.unsplash.com/photo-1622290319146-7b63df48a635?q=80&w=600' },
    { name: 'Foot Wear Section', slug: 'foot-wear-section', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const { data } = await api.get('/products?limit=4');
        setFeaturedProducts(data.products || []);
      } catch (err) {
        console.error('Failed to load featured products, using seeds fallback');
        // Fallback seed objects if backend not running
        setFeaturedProducts([
          {
            id: '1',
            name: 'Classic Cashmere Overcoat',
            slug: 'classic-cashmere-overcoat',
            price: 580,
            compareAtPrice: 720,
            rating: 4.8,
            images: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800'],
            brand: { name: 'COS' }
          },
          {
            id: '2',
            name: 'Miracle Sound ANC Headphones',
            slug: 'miracle-sound-headphones',
            price: 399,
            compareAtPrice: 450,
            rating: 4.9,
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800'],
            brand: { name: 'Apple' }
          },
          {
            id: '3',
            name: 'Signature Leather Tote',
            slug: 'signature-leather-tote',
            price: 450,
            compareAtPrice: null,
            rating: 4.9,
            images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800'],
            brand: { name: 'MIRACLE Studio' }
          },
          {
            id: '4',
            name: 'Botanical Face Oil',
            slug: 'botanical-face-oil',
            price: 85,
            compareAtPrice: null,
            rating: 4.7,
            images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800'],
            brand: { name: 'Aesop' }
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    async function loadCategories() {
      try {
        const { data } = await api.get('/products/metadata');
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.warn('Failed to load dynamic categories from backend.');
      }
    }

    loadFeatured();
    loadCategories();
  }, []);

  const reviews = [
    {
      name: 'Victoria Hastings',
      role: 'Fashion Consultant',
      stars: 5,
      comment: 'The cashmere coat is absolutely exquisite. The weight is perfect and it drape beautifully. A timeless piece that rivals old-money luxury brands.',
    },
    {
      name: 'Marcus Sterling',
      role: 'Architect',
      stars: 5,
      comment: 'Miracle ANC headphones represent pure form and function. Excellent response curves and the aluminum chassis feels solid yet incredibly light.',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full overflow-hidden bg-black flex items-center">
        {/* Background Image overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative mx-auto max-w-7xl w-full px-6 lg:px-8 text-white z-10 space-y-6">
          <span className="text-[10px] font-bold text-luxury-gold tracking-[6px] block animate-slide">
            Miracle Lookbook 2026
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide max-w-2xl leading-[1.1] animate-slide">
            Elevate Everyday Living
          </h1>
          <p className="text-sm md:text-base font-light tracking-wider text-[#CCCCCC] max-w-lg leading-relaxed">
            Discover premium apparel, acoustics, and accents crafted with architectural precision and high-contrast minimalism.
          </p>
          <div className="flex space-x-4 pt-4">
            <Link
              href="/shop"
              className="px-8 py-3.5 bg-white hover:bg-luxury-gold text-luxury-text hover:text-white text-xs font-bold tracking-widest rounded-luxury transition-all duration-300"
            >
              Shop Now
            </Link>
            <Link
              href="/blogs"
              className="px-8 py-3.5 border border-white hover:border-luxury-gold hover:text-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all duration-300"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-luxury-gold tracking-[4px]">Curated Catalog</span>
          <h2 className="font-serif text-3xl font-semibold">Featured Categories</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group relative aspect-[1/1] overflow-hidden rounded-luxury bg-luxury-border/30 border border-luxury-border/60 dark:border-luxury-darkBorder"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <span className="text-xs font-bold tracking-widest">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-baseline border-b border-luxury-border dark:border-luxury-darkBorder pb-4">
          <div>
            <span className="text-[10px] font-bold text-luxury-gold tracking-[4px] block">Highly Coveted</span>
            <h2 className="font-serif text-3xl font-semibold mt-1">Our Best Sellers</h2>
          </div>
          <Link href="/shop" className="group text-xs font-bold tracking-widest flex items-center hover:text-luxury-gold transition-colors mt-2 md:mt-0">
            View All Collections
            <ArrowRight size={14} className="ml-1.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-4 animate-pulse">
                <div className="aspect-[3/4] bg-luxury-border dark:bg-luxury-darkBorder rounded-luxury" />
                <div className="h-4 bg-luxury-border dark:bg-luxury-darkBorder w-2/3 rounded-sm" />
                <div className="h-3 bg-luxury-border dark:bg-luxury-darkBorder w-1/3 rounded-sm" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>


      {/* Brand Value Propositions */}
      <section className="bg-white dark:bg-luxury-darkCard border-y border-luxury-border dark:border-luxury-darkBorder py-12 transition-all">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <Truck size={24} className="text-luxury-gold" />
            <h4 className="font-serif text-base font-semibold">Complimentary Shipping</h4>
            <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted max-w-xs leading-relaxed">
              We offer tracked, express international shipping on all orders over ₹15,000.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <RefreshCw size={24} className="text-luxury-gold" />
            <h4 className="font-serif text-base font-semibold">14-Day Returns</h4>
            <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted max-w-xs leading-relaxed">
              If your items are not completely satisfactory, return them with our compliments.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <ShieldCheck size={24} className="text-luxury-gold" />
            <h4 className="font-serif text-base font-semibold">Genuine Guarantee</h4>
            <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted max-w-xs leading-relaxed">
              Every item is verified by our studios in Florence, Milan, and New York.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial lookbook highlight */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[10px] font-bold text-luxury-gold tracking-[4px] block">Design Philosophy</span>
          <h2 className="font-serif text-4xl font-semibold leading-tight">The Art of Essentialism</h2>
          <p className="text-sm text-luxury-muted dark:text-luxury-darkMuted leading-relaxed">
            We believe that items in your home and wardrobe should be expressions of quiet elegance. By focusing on raw textures like organic linen, combed cashmere, and Italian calfskin, we let the natural quality speak.
          </p>
          <div className="pt-2">
            <Link href="/blogs/art-of-essentialism-design" className="group text-xs font-bold tracking-widest flex items-center hover:text-luxury-gold transition-colors">
              Read Our Lookbook
              <ArrowRight size={14} className="ml-1.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600"
            alt="Editorial model"
            className="rounded-luxury w-full aspect-[3/4] object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600"
            alt="Luxury interior"
            className="rounded-luxury w-full aspect-[3/4] object-cover mt-8"
          />
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="text-center">
          <span className="text-[10px] font-bold text-luxury-gold tracking-[4px]">Circle of Trust</span>
          <h2 className="font-serif text-3xl font-semibold mt-1">Client Reviews</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder p-8 rounded-luxury shadow-luxury space-y-4">
              <div className="flex space-x-1 text-luxury-gold">
                {[...Array(r.stars)].map((_, idx) => (
                  <Star key={idx} size={14} fill="#C8A97E" />
                ))}
              </div>
              <p className="text-sm font-medium leading-relaxed italic text-luxury-muted dark:text-luxury-darkMuted">
                &ldquo;{r.comment}&rdquo;
              </p>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">{r.name}</h4>
                <p className="text-[9px] text-luxury-gold tracking-widest font-semibold mt-0.5">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
