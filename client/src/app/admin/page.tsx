'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink, ArrowLeft } from 'lucide-react';

export default function RedirectAdminPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 flex flex-col justify-center min-h-[70vh]">
      <div className="bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder p-8 rounded-luxury shadow-luxury space-y-6 text-center">
        
        <div className="mx-auto w-12 h-12 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold mb-4">
          <Shield size={24} />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">Admin Portal Migration</h2>
          <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted leading-relaxed">
            The MIRACLE Admin Console has moved to a dedicated, standalone management portal. 
            All catalog management, order adjustments, addresses, and customer profiles are now handled in the new system.
          </p>
        </div>

        <div className="flex flex-col space-y-2 pt-4">
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all text-center flex items-center justify-center space-x-2"
          >
            <span>Launch Admin Portal</span>
            <ExternalLink size={12} />
          </a>
          <Link
            href="/"
            className="w-full py-3 border border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-xs font-bold tracking-widest rounded-luxury transition-all text-center flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={12} />
            <span>Return to Boutique</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
