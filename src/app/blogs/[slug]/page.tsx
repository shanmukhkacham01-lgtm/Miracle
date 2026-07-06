'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../utils/api';
import { Calendar, BookOpen, User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const seedBlogs = [
    {
      id: '1',
      title: 'The Art of Essentialism in Design',
      slug: 'art-of-essentialism-design',
      summary: 'Exploring why clean lines, premium raw materials, and spaciousness compose the ultimate standard of luxury.',
      content: '<p>In a world of constant noise, subtraction is the ultimate luxury. Premium brands understand that a design is complete not when there is nothing left to add, but when there is nothing left to remove.</p><p>By prioritizing raw textures—Mongolian cashmere, vegetable-tanned calfskin, hand-turned clays—the products in the MIRACLE Studio collection stand on their own merit. There are no loud logos or transient design fads. The aesthetics are anchored in architectural proportions and timeless neutral palettes.</p>',
      coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
      category: 'Design Philosophy',
      readTime: '4 min read',
      author: { firstName: 'Elizabeth', lastName: 'Vance' },
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'A Guide to Styling Premium Whites',
      slug: 'styling-premium-whites',
      summary: 'How to combine textures, ivory accents, and off-white drapery for a timeless seasonal wardrobe.',
      content: '<p>Monochromatic wardrobes communicate effortless sophistication. However, styling all-white outfits requires an attention to texture contrast to prevent flat silhouettes.</p><p>Pairing heavy knits like our Silk Ribbed Cardigan with flowing linen trousers or layering structured cashmere coats over light white tees creates tactile variety. Keep footwear minimalist with our Nappa Leather Trainers to ground the outfit.</p>',
      coverImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
      category: 'Styling',
      readTime: '3 min read',
      author: { firstName: 'Elizabeth', lastName: 'Vance' },
      createdAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      try {
        const { data } = await api.get(`/blogs/${slug}`);
        setBlog(data.blog);
        setRelated(data.relatedBlogs || []);
      } catch (err) {
        console.warn('Backend server offline. Running client blog details fallback.');
        const found = seedBlogs.find((b) => b.slug === slug) || seedBlogs[0];
        setBlog(found);
        setRelated(seedBlogs.filter((b) => b.id !== found.id));
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 animate-pulse space-y-6">
        <div className="h-6 w-16 bg-luxury-border rounded-sm" />
        <div className="h-10 w-2/3 bg-luxury-border rounded-sm" />
        <div className="h-64 bg-luxury-border rounded-luxury" />
      </div>
    );
  }

  if (!blog) return <div className="text-center py-20 font-serif">Article Not Found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8 space-y-8">
      
      {/* Return link */}
      <div>
        <Link
          href="/blogs"
          className="inline-flex items-center text-xs font-bold tracking-wider hover:text-luxury-gold transition-colors"
        >
          <ChevronLeft size={14} className="mr-1" />
          <span>Back to Editorials</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-luxury-gold tracking-wider">{blog.category}</span>
        <h1 className="font-serif text-3xl md:text-5xl font-semibold leading-tight">{blog.title}</h1>
        <p className="text-sm text-luxury-muted dark:text-luxury-darkMuted italic leading-relaxed">
          {blog.summary}
        </p>

        <div className="flex flex-wrap gap-4 text-[10px] text-luxury-muted dark:text-luxury-darkMuted font-bold tracking-wider pt-2">
          <span className="flex items-center">
            <User size={12} className="mr-1" />
            {blog.author?.firstName} {blog.author?.lastName || ''}
          </span>
          <span className="flex items-center">
            <Calendar size={12} className="mr-1" />
            {new Date(blog.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center">
            <BookOpen size={12} className="mr-1" />
            {blog.readTime}
          </span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="aspect-[16/9] overflow-hidden rounded-luxury border border-luxury-border dark:border-luxury-darkBorder shadow-luxury bg-luxury-bg/50">
        <img src={blog.coverImage} alt="Cover" className="w-full h-full object-cover" />
      </div>

      {/* Body Content */}
      <article
        className="prose dark:prose-invert max-w-none text-sm text-luxury-muted dark:text-luxury-darkMuted leading-relaxed space-y-6 pt-4 border-b border-luxury-border dark:border-luxury-darkBorder pb-10"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Related blogs */}
      {related.length > 0 && (
        <section className="space-y-6 pt-6">
          <h3 className="font-serif text-xl font-semibold">Related Lookbooks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {related.map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.slug}`}
                className="group p-4 border border-luxury-border dark:border-luxury-darkBorder rounded-luxury bg-white dark:bg-luxury-darkCard hover:border-luxury-gold hover:shadow-luxury transition-all duration-300 block"
              >
                <span className="text-[10px] font-bold text-luxury-gold tracking-wider block mb-1">
                  {post.category}
                </span>
                <span className="text-sm font-semibold group-hover:text-luxury-gold transition-colors block">
                  {post.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
