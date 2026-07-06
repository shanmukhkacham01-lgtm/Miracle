import './globals.css';
import Providers from './Providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import LiveChat from '../components/LiveChat';

export const metadata = {
  title: 'MIRACLE | Discover the Extraordinary',
  description: 'Discover premium apparel, accessories, beauty, and acoustics crafted with elegance and minimalism.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'MIRACLE | Luxury Minimalist E-Commerce',
    description: 'Elevated essentials for modern living.',
    images: ['/logo.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full flex flex-col">
        <Providers>
          <div className="flex flex-col min-h-screen relative">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <CartDrawer />
            <LiveChat />
            
            {/* Watermark Logo */}
            <div className="fixed bottom-24 right-7 z-30 pointer-events-none opacity-20 select-none">
              <img
                src="/logo.jpg"
                alt="Miracle Collections Watermark"
                className="w-10 h-10 rounded-full border border-luxury-border/60 dark:border-luxury-darkBorder/60 shadow-md"
              />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
