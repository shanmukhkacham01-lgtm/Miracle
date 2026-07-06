'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '../store/store';
import { formatPrice } from '../store/cartSlice';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    rating: number;
    images: string[];
    brand?: { name: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { currency } = useAppSelector((state) => state.cart);

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder rounded-luxury shadow-luxury hover:shadow-luxuryHover transition-all duration-300">
      
      {/* Product Image Viewer */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-luxury-bg/50 dark:bg-luxury-darkBg">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
              loading="lazy"
            />
          )}
        </Link>

        {/* Action badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
          {hasDiscount && (
            <span className="bg-luxury-danger text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-luxury">
              -{discountPercent}%
            </span>
          )}
          {product.rating >= 4.8 && (
            <span className="bg-luxury-gold text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-luxury">
              Editor Pick
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-xs text-luxury-text dark:text-white hover:text-luxury-danger dark:hover:text-luxury-danger transition-colors shadow-sm">
          <Heart size={14} />
        </button>
      </div>

      {/* Product Text details */}
      <div className="p-4 flex flex-col justify-between flex-grow space-y-2">
        <div className="space-y-1">
          {product.brand && (
            <span className="text-[9px] font-bold text-luxury-gold tracking-widest">
              {product.brand.name}
            </span>
          )}
          <h3 className="font-serif text-sm font-semibold tracking-wide truncate">
            <Link href={`/product/${product.slug}`} className="hover:text-luxury-gold transition-colors">
              {product.name}
            </Link>
          </h3>
        </div>

        <div className="flex items-baseline space-x-2 pt-1">
          <span className="text-xs font-bold text-luxury-text dark:text-luxury-darkText">
            {formatPrice(product.price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-luxury-muted dark:text-luxury-darkMuted line-through">
              {formatPrice(product.compareAtPrice!, currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
