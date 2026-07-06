'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../utils/api';
import { useAppDispatch } from '../../../store/store';
import { addToCart, setCartOpen, formatPrice } from '../../../store/cartSlice';
import ProductCard from '../../../components/ProductCard';
import { Heart, Star, ShoppingBag, ArrowRight, RotateCw, Check, AlertCircle } from 'lucide-react';

export default function ProductDetailPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { slug } = useParams();

  // Product Data
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery
  const [activeImage, setActiveImage] = useState('');
  const [view360, setView360] = useState(false);
  const [frame360, setFrame360] = useState(0);

  // Selections
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);

  // Bundle Selector
  const [includeBundle1, setIncludeBundle1] = useState(true);
  const [includeBundle2, setIncludeBundle2] = useState(true);

  // Review Form
  const [reviews, setReviews] = useState<any[]>([]);
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Offline Fallback Seeds
  const seedProducts = [
    { id: '1', name: 'Classic Cashmere Overcoat', slug: 'classic-cashmere-overcoat', price: 580, compareAtPrice: 720, rating: 4.8, stock: 12, description: 'An elegant longline overcoat crafted from exceptionally soft, mid-weight Italian cashmere. Cut in a modern relaxed silhouette with dropped shoulders.', categoryId: 'fashion', brand: { name: 'COS' }, images: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800'], details: { Material: '100% Cashmere', Origin: 'Florence, Italy', Fit: 'Relaxed Fit' }, attributes: { colors: ['Beige', 'Black'], sizes: ['S', 'M', 'L'] } },
    { id: '3', name: 'Miracle Sound ANC Headphones', slug: 'miracle-sound-headphones', price: 399, compareAtPrice: 450, rating: 4.9, stock: 8, description: 'Premium active noise-cancelling wireless headphones with custom high-fidelity drivers. Wrapped in brushed aluminum and genuine full-grain leather.', categoryId: 'electronics', brand: { name: 'Apple' }, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800'], details: { Battery: '38 Hours', Driver: '40mm Dynamic' }, attributes: { colors: ['Space Grey', 'Chalk White'], sizes: ['One Size'] } },
  ];

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${slug}`);
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts || []);
        setFrequentlyBought(data.frequentlyBought || []);
        setReviews(data.product.reviews || []);
        
        // Setup initial details
        if (data.product.images?.length > 0) setActiveImage(data.product.images[0]);
        if (data.product.attributes?.colors?.length > 0) setSelectedColor(data.product.attributes.colors[0]);
        if (data.product.attributes?.sizes?.length > 0) setSelectedSize(data.product.attributes.sizes[0]);
      } catch (err) {
        console.warn('Backend server offline. Running client-side details page fallback.');
        const found = seedProducts.find((p) => p.slug === slug) || seedProducts[0];
        setProduct(found);
        setReviews([
          { id: '1', rating: 5, title: 'Outstanding Quality', comment: 'Exceeded all expectations. Very soft texture and fits beautifully.', user: { firstName: 'Julian', lastName: 'Gray' } }
        ]);
        setRelatedProducts(seedProducts.filter((p) => p.id !== found.id));
        setFrequentlyBought(seedProducts.filter((p) => p.id !== found.id));

        setActiveImage(found.images[0]);
        setSelectedColor(found.attributes.colors[0]);
        setSelectedSize(found.attributes.sizes[0]);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 animate-pulse space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] bg-luxury-border dark:bg-luxury-darkBorder rounded-luxury" />
          <div className="space-y-6">
            <div className="h-8 bg-luxury-border dark:bg-luxury-darkBorder w-2/3 rounded-sm" />
            <div className="h-4 bg-luxury-border dark:bg-luxury-darkBorder w-1/3 rounded-sm" />
            <div className="h-24 bg-luxury-border dark:bg-luxury-darkBorder rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 font-serif">Product Not Found.</div>;

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.images[0],
        quantity: qty,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        stock: product.stock,
      })
    );
    dispatch(setCartOpen(true));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const handleAddBundle = () => {
    // Add Main Item
    handleAddToCart();

    // Add selected bundle items
    frequentlyBought.forEach((item, idx) => {
      const isSelected = idx === 0 ? includeBundle1 : includeBundle2;
      if (isSelected) {
        dispatch(
          addToCart({
            productId: item.id,
            name: item.name,
            slug: item.slug,
            price: item.price,
            compareAtPrice: item.compareAtPrice,
            image: item.images[0],
            quantity: 1,
            size: item.attributes?.sizes?.[0] || 'Standard',
            color: item.attributes?.colors?.[0] || 'Default',
            stock: item.stock,
          })
        );
      }
    });
    dispatch(setCartOpen(true));
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revComment.trim()) return;

    setSubmittingReview(true);
    try {
      const { data } = await api.post('/products/review', {
        productId: product.id,
        rating: revRating,
        title: revTitle,
        comment: revComment,
      });

      setReviews((prev) => [
        {
          id: data.review.id,
          rating: revRating,
          title: revTitle,
          comment: revComment,
          user: { firstName: 'You', lastName: '' },
        },
        ...prev,
      ]);
      setRevTitle('');
      setRevComment('');
    } catch {
      // Mock review insertion on server offline
      setReviews((prev) => [
        {
          id: `local_${Date.now()}`,
          rating: revRating,
          title: revTitle,
          comment: revComment,
          user: { firstName: 'Anonymous', lastName: 'Reviewer' },
        },
        ...prev,
      ]);
      setRevTitle('');
      setRevComment('');
    } finally {
      setSubmittingReview(false);
    }
  };

  const totalBundlePrice =
    product.price +
    (includeBundle1 && frequentlyBought[0] ? frequentlyBought[0].price : 0) +
    (includeBundle2 && frequentlyBought[1] ? frequentlyBought[1].price : 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 space-y-20">
      
      {/* Upper Grid: Gallery & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left: Gallery Column */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] overflow-hidden bg-luxury-bg dark:bg-luxury-darkBg rounded-luxury border border-luxury-border dark:border-luxury-darkBorder">
            
            {view360 ? (
              <div
                className="w-full h-full flex flex-col items-center justify-center cursor-ew-resize select-none"
                onMouseMove={(e) => {
                  if (e.buttons === 1) {
                    const nextFrame = Math.floor((e.clientX / 20) % product.images.length);
                    setFrame360(Math.abs(nextFrame));
                  }
                }}
              >
                <img
                  src={product.images[frame360] || product.images[0]}
                  alt="360 View Frame"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-4 bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white px-3 py-1 rounded-full flex items-center">
                  <RotateCw size={10} className="mr-1.5 animate-spin" />
                  Drag horizontally to rotate
                </span>
              </div>
            ) : (
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
              />
            )}

            {/* Quick 360 Toggle */}
            <button
              onClick={() => setView360(!view360)}
              className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-black/80 rounded-full shadow-sm hover:text-luxury-gold transition-colors z-10"
              title="Toggle 360 View"
            >
              <RotateCw size={16} />
            </button>
          </div>

          {/* Gallery Thumbnails */}
          {!view360 && (
            <div className="flex space-x-3.5 overflow-x-auto no-scrollbar py-2">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-20 aspect-[3/4] flex-shrink-0 rounded-luxury overflow-hidden border ${
                    activeImage === img ? 'border-luxury-gold' : 'border-luxury-border dark:border-luxury-darkBorder'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Meta & Purchase Panel */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-luxury-gold tracking-widest block">{product.brand?.name}</span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold leading-tight">{product.name}</h1>
            
            {/* Reviews average display */}
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <div className="flex space-x-0.5 text-luxury-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.round(product.rating) ? '#C8A97E' : 'none'} />
                ))}
              </div>
              <span className="text-luxury-muted dark:text-luxury-darkMuted">({reviews.length} Client Reviews)</span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline space-x-3 pt-2">
              <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-sm text-luxury-muted dark:text-luxury-darkMuted line-through">{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>

            <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted leading-relaxed pt-2">
              {product.description}
            </p>

            {/* Variant selections */}
            <div className="space-y-4 pt-4 border-t border-luxury-border dark:border-luxury-darkBorder">
              {product.attributes?.colors && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-wider text-luxury-muted">Selected Color: {selectedColor}</span>
                  <div className="flex space-x-2">
                    {product.attributes.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                          selectedColor === color ? 'border-luxury-gold ring-1 ring-luxury-gold' : 'border-luxury-border dark:border-luxury-darkBorder'
                        }`}
                        title={color}
                      >
                        <span className={`w-5 h-5 rounded-full`} style={{ backgroundColor: color === 'Beige' ? '#D2B48C' : color === 'Oatmeal' ? '#EAE6DF' : color === 'Sage' ? '#9CAF88' : color.toLowerCase() }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.attributes?.sizes && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold tracking-wider text-luxury-muted">Selected Size: {selectedSize}</span>
                  <div className="flex space-x-2">
                    {product.attributes.sizes.map((sz: string) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3 py-1.5 border text-xs font-semibold rounded-luxury uppercase transition-all ${
                          selectedSize === sz
                            ? 'bg-luxury-text dark:bg-white text-white dark:text-luxury-text border-luxury-text dark:border-white'
                            : 'border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-luxury-muted'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action purchase panel */}
          <div className="border-t border-luxury-border dark:border-luxury-darkBorder pt-6 space-y-4">
            
            {/* Inventory count warnings */}
            <div className="flex items-center space-x-2 text-xs font-semibold">
              {product.stock === 0 ? (
                <span className="text-luxury-danger flex items-center">
                  <AlertCircle size={14} className="mr-1.5" /> Out of stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="text-luxury-danger flex items-center animate-pulse">
                  <AlertCircle size={14} className="mr-1.5" /> Only {product.stock} items left in stock - order soon
                </span>
              ) : (
                <span className="text-luxury-success flex items-center">
                  <Check size={14} className="mr-1.5" /> In stock, ready to ship
                </span>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                className="flex-grow py-4 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all disabled:opacity-40 disabled:hover:bg-luxury-text flex items-center justify-center space-x-2"
              >
                <ShoppingBag size={14} />
                <span>Add to Bag</span>
              </button>
              <button
                disabled={product.stock === 0}
                onClick={handleBuyNow}
                className="flex-grow py-4 border border-luxury-text dark:border-luxury-darkBorder hover:border-luxury-gold hover:text-luxury-gold text-xs font-bold tracking-widest rounded-luxury transition-all disabled:opacity-40"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications / Detail accordions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 border-y border-luxury-border dark:border-luxury-darkBorder py-12">
        <div>
          <h4 className="font-serif text-lg font-semibold mb-3">Material &amp; Make</h4>
          <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted leading-relaxed">
            Every product is made in small batches. We source organic, raw fibers and work directly with multi-generational workshops in Italy and New York.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-lg font-semibold mb-3">Specifications</h4>
          <ul className="text-xs space-y-2">
            {product.details ? (
              Object.entries(product.details).map(([k, v]: any) => (
                <li key={k} className="flex justify-between border-b border-luxury-border/50 dark:border-luxury-darkBorder/50 pb-1.5">
                  <span className="text-luxury-muted font-medium">{k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))
            ) : (
              <li className="text-luxury-muted">No specifications listed.</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-lg font-semibold mb-3">Priority Services</h4>
          <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted leading-relaxed">
            Complimentary signature wrapping. Tracked carbon-neutral priority shipping. 14-day returns in original packaging.
          </p>
        </div>
      </section>

      {/* Frequently Bought Together Bundle */}
      {frequentlyBought.length > 0 && (
        <section className="bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder rounded-luxury p-8 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-luxury-gold tracking-[4px] block">Style Ensemble</span>
            <h3 className="font-serif text-xl font-semibold mt-1">Frequently Bought Together</h3>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xl font-light">
              
              {/* Main Item */}
              <div className="flex items-center space-x-3 bg-luxury-bg dark:bg-luxury-darkBg p-3 rounded-luxury border border-luxury-border dark:border-luxury-darkBorder">
                <img src={product.images[0]} alt={product.name} className="w-12 h-16 object-cover rounded-luxury" />
                <div className="text-xs font-semibold">
                  <p className="max-w-[140px] truncate">{product.name}</p>
                  <p className="text-luxury-gold">{formatPrice(product.price)}</p>
                </div>
              </div>

              <span>+</span>

              {/* Bundle 1 */}
              {frequentlyBought[0] && (
                <div className="flex items-center space-x-3 bg-luxury-bg dark:bg-luxury-darkBg p-3 rounded-luxury border border-luxury-border dark:border-luxury-darkBorder">
                  <img src={frequentlyBought[0].images[0]} alt="Bundle Item 1" className="w-12 h-16 object-cover rounded-luxury" />
                  <div className="text-xs font-semibold">
                    <p className="max-w-[140px] truncate">{frequentlyBought[0].name}</p>
                    <p className="text-luxury-gold">{formatPrice(frequentlyBought[0].price)}</p>
                  </div>
                </div>
              )}

              {/* Bundle 2 */}
              {frequentlyBought[1] && (
                <>
                  <span>+</span>
                  <div className="flex items-center space-x-3 bg-luxury-bg dark:bg-luxury-darkBg p-3 rounded-luxury border border-luxury-border dark:border-luxury-darkBorder">
                    <img src={frequentlyBought[1].images[0]} alt="Bundle Item 2" className="w-12 h-16 object-cover rounded-luxury" />
                    <div className="text-xs font-semibold">
                      <p className="max-w-[140px] truncate">{frequentlyBought[1].name}</p>
                      <p className="text-luxury-gold">{formatPrice(frequentlyBought[1].price)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Calculations and checkbox selection */}
            <div className="space-y-4 w-full lg:w-auto text-center lg:text-left">
              <div className="space-y-2 text-xs font-semibold text-luxury-muted">
                <label className="flex items-center space-x-2 justify-center lg:justify-start cursor-pointer">
                  <input type="checkbox" checked={true} disabled className="accent-luxury-gold" />
                  <span>This item: {formatPrice(product.price)}</span>
                </label>
                {frequentlyBought[0] && (
                  <label className="flex items-center space-x-2 justify-center lg:justify-start cursor-pointer">
                    <input type="checkbox" checked={includeBundle1} onChange={(e) => setIncludeBundle1(e.target.checked)} className="accent-luxury-gold" />
                    <span>{frequentlyBought[0].name}: {formatPrice(frequentlyBought[0].price)}</span>
                  </label>
                )}
                {frequentlyBought[1] && (
                  <label className="flex items-center space-x-2 justify-center lg:justify-start cursor-pointer">
                    <input type="checkbox" checked={includeBundle2} onChange={(e) => setIncludeBundle2(e.target.checked)} className="accent-luxury-gold" />
                    <span>{frequentlyBought[1].name}: {formatPrice(frequentlyBought[1].price)}</span>
                  </label>
                )}
              </div>

              <div className="pt-2 flex flex-col md:flex-row items-center gap-4 justify-center lg:justify-start">
                <div>
                  <span className="text-xs text-luxury-muted block">Bundle Total</span>
                  <span className="text-lg font-bold">{formatPrice(totalBundlePrice)}</span>
                </div>
                <button
                  onClick={handleAddBundle}
                  className="px-6 py-3 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-colors"
                >
                  Add Ensemble to Bag
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Review details and write forms */}
      <section className="space-y-8">
        <div className="border-b border-luxury-border dark:border-luxury-darkBorder pb-4">
          <h3 className="font-serif text-2xl font-semibold">Client Reviews</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Write a review form */}
          <div className="space-y-6">
            <h4 className="font-serif text-lg font-semibold">Write a Review</h4>
            <form onSubmit={handleAddReview} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-luxury-muted">Rating</label>
                <div className="flex space-x-1.5 text-luxury-gold">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRevRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star size={20} fill={star <= revRating ? '#C8A97E' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-luxury-muted">Review Title</label>
                <input
                  type="text"
                  required
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  placeholder="e.g. Architectural Beauty"
                  className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 text-xs focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-luxury-muted">Comments</label>
                <textarea
                  required
                  rows={4}
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Describe your tactile experience with the material, fit, and elegance..."
                  className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2 text-xs focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-luxury-text text-white text-xs font-bold tracking-widest rounded-luxury hover:bg-luxury-gold transition-colors disabled:opacity-50"
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <p className="text-xs text-luxury-muted italic py-6">Be the first to review this product.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="border-b border-luxury-border/50 dark:border-luxury-darkBorder/50 pb-5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-0.5 text-luxury-gold">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={11} fill={i < rev.rating ? '#C8A97E' : 'none'} />
                        ))}
                      </div>
                      {rev.title && <span className="text-xs font-bold">{rev.title}</span>}
                    </div>
                    <span className="text-[9px] text-luxury-muted tracking-wider">
                      by {rev.user?.firstName} {rev.user?.lastName || ''}
                    </span>
                  </div>
                  <p className="text-xs text-luxury-muted leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="border-b border-luxury-border dark:border-luxury-darkBorder pb-4">
            <span className="text-[10px] font-bold text-luxury-gold tracking-[4px] block">Complements</span>
            <h3 className="font-serif text-2xl font-semibold mt-1">Related Products</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
