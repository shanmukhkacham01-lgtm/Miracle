'use client';

import React from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../store/store';
import { toggleCart, updateQuantity, removeFromCart, formatPrice } from '../store/cartSlice';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const dispatch = useAppDispatch();
  const { items, cartOpen, currency } = useAppSelector((state) => state.cart);

  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const cartCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(toggleCart())}
            className="absolute inset-0 bg-luxury-text/30 dark:bg-black/50 backdrop-blur-xs"
          />

          <div className="pointer-events-none absolute inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="pointer-events-auto w-screen max-w-md bg-white dark:bg-luxury-darkCard shadow-luxury border-l border-luxury-border dark:border-luxury-darkBorder flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-luxury-border dark:border-luxury-darkBorder px-6 py-5">
                <div className="flex items-center space-x-2">
                  <ShoppingBag size={18} />
                  <span className="font-serif text-lg font-semibold">Your Bag ({cartCount})</span>
                </div>
                <button
                  onClick={() => dispatch(toggleCart())}
                  className="p-1 hover:text-luxury-gold transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <ShoppingBag size={48} className="text-luxury-border dark:text-luxury-darkBorder" />
                    <p className="font-serif text-lg font-medium">Your bag is empty</p>
                    <p className="text-xs text-luxury-muted max-w-[200px]">Fill it with clean aesthetic designs from our shop.</p>
                    <button
                      onClick={() => dispatch(toggleCart())}
                      className="mt-4 px-6 py-2.5 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-colors"
                    >
                      Shop Now
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 border-b border-luxury-border/50 dark:border-luxury-darkBorder/50 pb-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 object-cover rounded-luxury border border-luxury-border dark:border-luxury-darkBorder"
                      />
                      
                      <div className="flex-grow space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold tracking-wider hover:text-luxury-gold transition-colors truncate max-w-[160px]">
                            {item.name}
                          </span>
                          <span className="text-xs font-bold">{formatPrice(item.price * item.quantity, currency)}</span>
                        </div>
                        
                        <p className="text-[10px] text-luxury-muted dark:text-luxury-darkMuted tracking-wider font-semibold">
                          {item.color} {item.size ? `/ Size ${item.size}` : ''}
                        </p>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-luxury-border dark:border-luxury-darkBorder rounded-luxury">
                            <button
                              onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                              className="px-2.5 py-1 text-luxury-muted hover:text-luxury-text"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="px-2 text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                              className="px-2.5 py-1 text-luxury-muted hover:text-luxury-text"
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          <button
                            onClick={() => dispatch(removeFromCart(item.id))}
                            className="p-1 hover:text-luxury-danger transition-colors text-luxury-muted"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Calculation Panel */}
              {items.length > 0 && (
                <div className="border-t border-luxury-border dark:border-luxury-darkBorder px-6 py-6 bg-luxury-bg/50 dark:bg-luxury-darkBg/50 space-y-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-luxury-muted">Subtotal</span>
                    <span>{formatPrice(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-luxury-muted">Shipping</span>
                    <span>{subtotal > 200 ? 'Free' : formatPrice(15, currency)}</span>
                  </div>
                  <div className="border-t border-luxury-border dark:border-luxury-darkBorder pt-3 flex justify-between text-sm font-bold">
                    <span>Estimated Total</span>
                    <span>{formatPrice(subtotal + (subtotal > 200 ? 0 : 15), currency)}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-4">
                    <Link
                      href="/checkout"
                      onClick={() => dispatch(toggleCart())}
                      className="w-full text-center py-3 bg-luxury-text dark:bg-luxury-darkText hover:bg-luxury-gold dark:hover:bg-luxury-gold text-white dark:text-luxury-text hover:text-white transition-colors text-xs font-bold tracking-widest rounded-luxury"
                    >
                      Checkout
                    </Link>
                    <button
                      onClick={() => dispatch(toggleCart())}
                      className="w-full py-3 border border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-xs font-bold tracking-widest rounded-luxury transition-all"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
