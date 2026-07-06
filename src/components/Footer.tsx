'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Youtube, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-white dark:bg-black border-t border-luxury-border dark:border-luxury-darkBorder text-luxury-text dark:text-luxury-darkText transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand & Socials Col */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="font-serif text-xl font-semibold tracking-[4px]">MIRACLE</span>
              <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted leading-relaxed max-w-xs">
                Discover the extraordinary. We craft and curate luxury essentials for elevated everyday living, balancing architectural form with fine raw textures.
              </p>
            </div>
            
            {/* Social Icons Row */}
            <div className="flex items-center space-x-4 text-luxury-muted dark:text-luxury-darkMuted">
              {/* WhatsApp */}
              <a
                href="https://chat.whatsapp.com/C4XWYqZ3shP8bWGHawr944?s=cl&p=a&ilr=0"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-luxury-gold transition-colors duration-200"
                title="WhatsApp Group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.59 2.028 14.108.995 11.5.993 6.066.993 1.646 5.363 1.642 10.793c-.001 1.64.499 3.24 1.448 4.82l-.999 3.648 3.737-.978z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=108ys3ua"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-luxury-gold transition-colors duration-200"
                title="Instagram Profile"
              >
                <Instagram size={18} />
              </a>
              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/1BtTzur1wx/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-luxury-gold transition-colors duration-200"
                title="Facebook Page"
              >
                <Facebook size={18} />
              </a>
              {/* Youtube */}
              <a
                href="https://youtube.com/@miraclecollections-b1f?si=CCu3-v-ZvekkVJUZ"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-luxury-gold transition-colors duration-200"
                title="YouTube Channel"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-muted dark:text-luxury-darkMuted mb-4">Collections</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link href="/shop?category=men-section" className="hover:text-luxury-gold transition-colors">Men Section</Link></li>
              <li><Link href="/shop?category=women-section" className="hover:text-luxury-gold transition-colors">Women Section</Link></li>
              <li><Link href="/shop?category=kids-section" className="hover:text-luxury-gold transition-colors">Kids Section</Link></li>
              <li><Link href="/shop?category=foot-wear-section" className="hover:text-luxury-gold transition-colors">Foot Wear Section</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-muted dark:text-luxury-darkMuted mb-4">Store Contacts</h4>
            <ul className="space-y-3.5 text-xs font-semibold">
              <li className="flex items-center space-x-2">
                <Phone size={14} className="text-luxury-gold shrink-0" />
                <a href="tel:9346277009" className="hover:text-luxury-gold transition-colors">
                  +91 93462 77009
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={14} className="text-luxury-gold shrink-0" />
                <a href="mailto:miraclecollections581@gmail.com" className="hover:text-luxury-gold transition-colors">
                  miraclecollections581@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin size={14} className="text-luxury-gold shrink-0 mt-0.5" />
                <a
                  href="https://share.google/mRgXdrLpcYVrEMNZT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-luxury-gold transition-colors leading-relaxed"
                >
                  Locate Store on Google Maps
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter subscription */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-muted dark:text-luxury-darkMuted mb-4">Newsletter</h4>
            <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted">
              Sign up to receive invitations to private seasonal sales and design lookbooks.
            </p>
            {subscribed ? (
              <p className="text-xs font-bold text-luxury-gold animate-fade">Thank you. You have been added to our circle.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex border-b border-luxury-text dark:border-luxury-darkBorder py-1.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="bg-transparent text-xs w-full outline-none placeholder-luxury-muted"
                  required
                />
                <button type="submit" className="text-xs font-bold tracking-widest hover:text-luxury-gold transition-colors">
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright details */}
        <div className="mt-16 pt-8 border-t border-luxury-border dark:border-luxury-darkBorder flex flex-col md:flex-row justify-between items-center text-[10px] text-luxury-muted tracking-wider font-semibold">
          <span>&copy; {new Date().getFullYear()} MIRACLE Studio. All Rights Reserved.</span>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-luxury-gold transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-luxury-gold transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-luxury-gold transition-colors">Cookie settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
