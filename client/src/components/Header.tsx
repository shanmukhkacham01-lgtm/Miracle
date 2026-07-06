'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store/store';
import { toggleCart, setCurrency, setLanguage, toggleTheme, formatPrice } from '../store/cartSlice';
import { Search, User, ShoppingBag, Sun, Moon, Menu, X, Globe, Mic, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, currency, language, darkMode } = useAppSelector((state) => state.cart);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const cartCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('miracle_access_token'));
  }, []);

  // Suggestions API fetch
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products/search-suggestions?q=${searchQuery}`);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  const handleVoiceSearch = () => {
    setIsListening(true);
    setSearchQuery('Cashmere overcoat'); // Simulate speech output
    setTimeout(() => {
      setIsListening(false);
    }, 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-luxury-border/80 bg-luxury-bg/95 backdrop-blur-md dark:border-luxury-darkBorder/80 dark:bg-luxury-darkBg/95 transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          
          {/* Left: Mobile Nav & Localization */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 lg:hidden hover:text-luxury-gold transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Quick Selectors */}
            <div className="hidden lg:flex items-center space-x-4 text-xs font-medium tracking-wider text-luxury-muted dark:text-luxury-darkMuted">
              {/* Currency Display */}
              <div className="py-1">
                <span className="text-luxury-text dark:text-luxury-darkText select-none">INR (₹)</span>
              </div>

              {/* Language Selector */}
              <div className="relative group cursor-pointer py-1">
                <span className="hover:text-luxury-text dark:hover:text-luxury-darkText flex items-center space-x-1">
                  <Globe size={12} />
                  <span>{language}</span>
                </span>
                <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder rounded-luxury shadow-luxury py-1 min-w-[70px] z-50">
                  {['EN', 'FR', 'ES'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => dispatch(setLanguage(lang as any))}
                      className="block w-full px-3 py-1.5 text-left hover:bg-luxury-bg dark:hover:bg-luxury-darkBg hover:text-luxury-gold"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Brand Wordmark */}
          <div className="flex justify-center flex-grow lg:flex-grow-0">
            <Link href="/" className="group flex items-center space-x-2.5">
              <img
                src="/logo.jpg"
                alt="Miracle Collections Logo"
                className="h-9 w-9 object-contain rounded-full border border-luxury-border/60 dark:border-luxury-darkBorder/60"
              />
              <span className="font-serif text-lg font-semibold tracking-[5px] text-luxury-text dark:text-luxury-darkText group-hover:text-luxury-gold transition-colors uppercase">
                miracle
              </span>
            </Link>
          </div>

          {/* Right: Navigation Links & Actions */}
          <div className="flex items-center space-x-6">
            <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold tracking-widest">
              <Link href="/shop" className="hover:text-luxury-gold transition-colors">Shop</Link>
              <Link href="/blogs" className="hover:text-luxury-gold transition-colors">Editorial</Link>
              <Link href="/about" className="hover:text-luxury-gold transition-colors">Our Story</Link>
            </nav>

            <div className="flex items-center space-x-4 border-l border-luxury-border dark:border-luxury-darkBorder pl-6">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-1 hover:text-luxury-gold transition-colors"
                title="Search"
              >
                <Search size={18} />
              </button>

              {/* Account Profile */}
              <Link
                href={isLoggedIn ? '/dashboard' : '/auth/login'}
                className="p-1 hover:text-luxury-gold transition-colors"
                title="Profile"
              >
                <User size={18} />
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={() => dispatch(toggleTheme())}
                className="p-1 hover:text-luxury-gold transition-colors"
                title="Toggle Theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Cart Button */}
              <button
                onClick={() => dispatch(toggleCart())}
                className="relative p-1 hover:text-luxury-gold transition-colors"
                title="Shopping Cart"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-luxury-gold text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AI Style Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-luxury-text/40 dark:bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              className="bg-luxury-bg dark:bg-luxury-darkCard border-b border-luxury-border dark:border-luxury-darkBorder w-full px-6 py-8"
            >
              <div className="mx-auto max-w-3xl">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-serif text-xl tracking-wider">Search MIRACLE</span>
                  <button onClick={() => setSearchOpen(false)} className="p-1 hover:text-luxury-gold">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-luxury-text dark:border-luxury-darkBorder py-3">
                  <Search size={22} className="text-luxury-muted mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product, category, or aesthetic..."
                    className="flex-grow bg-transparent outline-none text-lg placeholder-luxury-muted dark:placeholder-luxury-darkMuted"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={`p-1.5 rounded-full mr-2 transition-colors ${
                      isListening ? 'bg-luxury-danger text-white animate-pulse' : 'hover:bg-luxury-border dark:hover:bg-luxury-darkBorder'
                    }`}
                  >
                    <Mic size={18} />
                  </button>
                </form>

                {/* Suggestions / Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  {/* Dynamic Suggestions */}
                  {suggestions.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-bold tracking-widest text-luxury-muted uppercase mb-4">Aesthetic Matches</h4>
                      <ul className="space-y-4">
                        {suggestions.map((item: any) => (
                          <li key={item.id}>
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center space-x-3 group"
                            >
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-luxury border border-luxury-border dark:border-luxury-darkBorder"
                              />
                              <div>
                                <p className="text-sm font-semibold group-hover:text-luxury-gold transition-colors">{item.name}</p>
                                <p className="text-xs text-luxury-muted">{formatPrice(item.price)}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-bold tracking-widest text-luxury-muted uppercase mb-4">Trending Searches</h4>
                      <ul className="space-y-2 text-sm font-semibold">
                        {['Cashmere Overcoat', 'Minimalist Trainer', 'Botanical face oil', 'ANC headphones'].map((term) => (
                          <li key={term}>
                            <button
                              onClick={() => setSearchQuery(term)}
                              className="hover:text-luxury-gold transition-colors flex items-center"
                            >
                              <ArrowRight size={12} className="mr-2 opacity-50" />
                              {term}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Aesthetic lookbook references */}
                  <div>
                    <h4 className="text-xs font-bold tracking-widest text-luxury-muted uppercase mb-4">Recent Searches</h4>
                    <p className="text-xs text-luxury-muted italic">No recent searches. Discover our winter editorial line.</p>
                    <Link
                      href="/blogs/art-of-essentialism-design"
                      onClick={() => setSearchOpen(false)}
                      className="mt-4 block p-4 border border-luxury-border dark:border-luxury-darkBorder rounded-luxury bg-white dark:bg-luxury-darkBg hover:border-luxury-gold transition-colors"
                    >
                      <span className="text-[10px] font-bold text-luxury-gold tracking-wider block mb-1">Lookbook Editorial</span>
                      <span className="text-sm font-semibold block">The Art of Essentialism in Design</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Slide-Over */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-luxury-bg dark:bg-luxury-darkCard p-6 shadow-luxury flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-10">
                  <span className="font-serif text-xl tracking-[4px] font-semibold">MIRACLE</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:text-luxury-gold">
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex flex-col space-y-6 text-sm font-semibold tracking-wider">
                  <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-luxury-gold">Shop Collections</Link>
                  <Link href="/blogs" onClick={() => setMobileMenuOpen(false)} className="hover:text-luxury-gold">Editorial Lookbook</Link>
                  <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-luxury-gold">Our Story</Link>
                </nav>
              </div>

              {/* Bottom Mobile Selectors */}
              <div className="border-t border-luxury-border dark:border-luxury-darkBorder pt-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-luxury-muted">
                  <span>Language</span>
                  <div className="flex space-x-2 font-bold text-luxury-text dark:text-luxury-darkText">
                    {['EN', 'FR', 'ES'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => dispatch(setLanguage(lang as any))}
                        className={`uppercase ${language === lang ? 'text-luxury-gold' : ''}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
