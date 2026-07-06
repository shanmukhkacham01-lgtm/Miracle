import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string; // cart item unique ID or combination
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  cartOpen: boolean;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  language: 'EN' | 'FR' | 'ES';
  darkMode: boolean;
}

const getInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('miracle_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('miracle_theme') === 'dark';
  } catch {
    return false;
  }
};

const getInitialCurrency = (): 'USD' | 'EUR' | 'GBP' | 'INR' => {
  return 'INR';
};

const initialState: CartState = {
  items: getInitialCart(),
  cartOpen: false,
  currency: 'INR',
  language: 'EN',
  darkMode: getInitialTheme(),
};

const currencyRates = {
  USD: 83.0,
  EUR: 83.0,
  GBP: 83.0,
  INR: 83.0,
};

const currencySymbols = {
  USD: '₹',
  EUR: '₹',
  GBP: '₹',
  INR: '₹',
};

export const formatPrice = (priceInUSD: number, _currency?: any) => {
  const converted = priceInUSD * 83.0; // DB prices are in USD, convert to INR
  return `₹${converted.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    toggleCart: (state) => {
      state.cartOpen = !state.cartOpen;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.cartOpen = action.payload;
    },
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'id'>>) => {
      const { productId, size, color, quantity } = action.payload;
      const id = `${productId}-${size || 'none'}-${color || 'none'}`;
      
      const existing = state.items.find((item) => item.id === id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, existing.stock);
      } else {
        state.items.push({ ...action.payload, id });
      }
      localStorage.setItem('miracle_cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.quantity = Math.max(1, Math.min(action.payload.quantity, item.stock));
      }
      localStorage.setItem('miracle_cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      localStorage.setItem('miracle_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.setItem('miracle_cart', JSON.stringify([]));
    },
    setCurrency: (state, action: PayloadAction<CartState['currency']>) => {
      state.currency = action.payload;
      localStorage.setItem('miracle_currency', action.payload);
    },
    setLanguage: (state, action: PayloadAction<CartState['language']>) => {
      state.language = action.payload;
    },
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('miracle_theme', state.darkMode ? 'dark' : 'light');
      
      // Update HTML class
      if (typeof document !== 'undefined') {
        if (state.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    syncCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      localStorage.setItem('miracle_cart', JSON.stringify(state.items));
    }
  },
});

export const {
  toggleCart,
  setCartOpen,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  setCurrency,
  setLanguage,
  toggleTheme,
  syncCart,
} = cartSlice.actions;

export default cartSlice.reducer;
