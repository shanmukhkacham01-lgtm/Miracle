'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../utils/api';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback Seed Articles
  const seedBlogs = [
    {
      id: '1',
      title: 'The Art of Essentialism in Design',
      slug: 'art-of-essentialism-design',
      summary: 'Exploring why clean lines, premium raw materials, and spaciousness compose the ultimate standard of luxury.',
      coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
      category: 'Design Philosophy',
      readTime: '4 min read',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'A Guide to Styling Premium Whites',
      slug: 'styling-premium-whites',
      summary: 'How to combine textures, ivory accents, and off-white drapery for a timeless seasonal wardrobe.',
      coverImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
      category: 'Styling',
      readTime: '3 min read',
      createdAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    async function loadBlogs() {
      try {
        const { data } = await api.get('/blogs');
        setBlogs(data.blogs || []);
      } catch (err) {
        console.warn('Backend server offline. Using blog seeds fallback.');
        setBlogs(seedBlogs);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-[10px] font-bold text-luxury-gold tracking-[6px]">Miracle Lookbooks</span>
        <h1 className="font-serif text-4xl font-semibold leading-tight">Editorial &amp; Aesthetics</h1>
        <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted max-w-md mx-auto leading-relaxed">
          Read articles on architectural shapes, seasonal looks, and our design philosophies.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          {[1, 2].map((n) => (
            <div key={n} className="space-y-4">
              <div className="aspect-[16/9] bg-luxury-border dark:bg-luxury-darkBorder rounded-luxury" />
              <div className="h-4 bg-luxury-border w-1/3 rounded-sm" />
              <div className="h-6 bg-luxury-border w-2/3 rounded-sm" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {blogs.map((post) => (
            <div
              key={post.id}
              className="group border border-luxury-border dark:border-luxury-darkBorder rounded-luxury overflow-hidden bg-white dark:bg-luxury-darkCard shadow-luxury hover:shadow-luxuryHover transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-luxury-bg/50 dark:bg-luxury-darkBg">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  <span className="absolute top-4 left-4 bg-white/95 dark:bg-black/85 text-[9px] font-bold text-luxury-gold px-2.5 py-1 rounded-full border border-luxury-border dark:border-luxury-darkBorder shadow-xs">
                    {post.category}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center space-x-4 text-[10px] text-luxury-muted dark:text-luxury-darkMuted font-bold tracking-wider">
                    <span className="flex items-center">
                      <Calendar size={11} className="mr-1" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <BookOpen size={11} className="mr-1" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-luxury-gold transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted leading-relaxed">
                    {post.summary}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href={`/blogs/${post.slug}`}
                  className="inline-flex items-center text-xs font-bold tracking-widest text-luxury-text dark:text-white hover:text-luxury-gold transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight size={12} className="ml-1.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
