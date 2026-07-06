import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          bg: '#FAFAF8',
          card: '#FFFFFF',
          text: '#111111',
          muted: '#666666',
          border: '#E8E8E8',
          gold: '#C8A97E',
          success: '#22C55E',
          danger: '#EF4444',
          darkBg: '#121212',
          darkCard: '#1C1C1E',
          darkText: '#F5F5F7',
          darkMuted: '#8E8E93',
          darkBorder: '#2C2C2E',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Didot', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        luxury: '12px',
      },
      boxShadow: {
        luxury: '0 4px 20px -2px rgba(17, 17, 17, 0.04), 0 2px 6px -1px rgba(17, 17, 17, 0.02)',
        luxuryHover: '0 12px 30px -4px rgba(17, 17, 17, 0.08), 0 4px 12px -2px rgba(17, 17, 17, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
