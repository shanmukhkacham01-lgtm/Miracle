import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding...');

  // 1. Clear Existing Data
  await prisma.notification.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.review.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@miracle.luxury';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const userPasswordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: 'Elizabeth',
      lastName: 'Vance',
      role: 'ADMIN',
      isEmailVerified: true,
      referralCode: 'MRC-ADMIN1',
      cart: { create: {} },
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'user@miracle.luxury',
      passwordHash: userPasswordHash,
      firstName: 'Julian',
      lastName: 'Gray',
      role: 'USER',
      isEmailVerified: true,
      referralCode: 'MRC-USER77',
      points: 120,
      cart: { create: {} },
    },
  });

  // Seed default address for user
  const userAddress = await prisma.address.create({
    data: {
      userId: customerUser.id,
      name: 'Julian Gray',
      phone: '+1 555 382 9102',
      street: '452 Mercer Street, Apt 3B',
      city: 'New York',
      state: 'NY',
      postalCode: '10012',
      country: 'United States',
      type: 'SHIPPING',
      isDefault: true,
    },
  });

  console.log('[Seed] Seeding Categories...');
  const categories = {
    men: await prisma.category.create({
      data: { name: 'Men Section', slug: 'men-section', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600' },
    }),
    women: await prisma.category.create({
      data: { name: 'Women Section', slug: 'women-section', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600' },
    }),
    kids: await prisma.category.create({
      data: { name: 'Kids Section', slug: 'kids-section', image: 'https://images.unsplash.com/photo-1622290319146-7b63df48a635?q=80&w=600' },
    }),
    footwear: await prisma.category.create({
      data: { name: 'Foot Wear Section', slug: 'foot-wear-section', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600' },
    }),
  };

  console.log('[Seed] Seeding Brands...');
  const brands = {
    cos: await prisma.brand.create({ data: { name: 'COS', slug: 'cos', description: 'Clean, architectural collections.' } }),
    nike: await prisma.brand.create({ data: { name: 'Nike Lab', slug: 'nike-lab', description: 'Modern athletic utility.' } }),
    apple: await prisma.brand.create({ data: { name: 'Apple', slug: 'apple', description: 'Minimalist electronics & hardware.' } }),
    aesop: await prisma.brand.create({ data: { name: 'Aesop', slug: 'aesop', description: 'Premium botanical formulations.' } }),
    miracle: await prisma.brand.create({ data: { name: 'MIRACLE Studio', slug: 'miracle-studio', description: 'In-house luxury items.' } }),
  };

  console.log('[Seed] Seeding Products...');
  const productsData = [
    {
      name: 'Classic Cashmere Overcoat',
      slug: 'classic-cashmere-overcoat',
      description: 'An elegant longline overcoat crafted from exceptionally soft, mid-weight Italian cashmere. Cut in a modern relaxed silhouette with dropped shoulders and notched lapels.',
      price: 580.00,
      compareAtPrice: 720.00,
      stock: 12,
      sku: 'MRC-CSH-COAT-01',
      categoryId: categories.men.id,
      brandId: brands.cos.id,
      isFeatured: true,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800'
      ],
      details: {
        Material: '100% Organic Mongolian Cashmere',
        Origin: 'Made in Florence, Italy',
        Fit: 'Relaxed/Drape Fit',
        Care: 'Dry Clean Only'
      },
      attributes: {
        colors: ['Beige', 'Charcoal Black', 'Soft White'],
        sizes: ['S', 'M', 'L', 'XL']
      }
    },
    {
      name: 'Silk Ribbed Knit Cardigan',
      slug: 'silk-ribbed-knit-cardigan',
      description: 'A delicate ribbed knit cardigan featuring a fine silk-cotton blend. Mother-of-pearl buttons add a classic, refined accent to this slim-fitting everyday staple.',
      price: 290.00,
      compareAtPrice: null,
      stock: 25,
      sku: 'MRC-SLK-KNT-02',
      categoryId: categories.women.id,
      brandId: brands.cos.id,
      isFeatured: false,
      rating: 4.6,
      images: [
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800',
        'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800'
      ],
      details: {
        Material: '70% Silk, 30% Egyptian Cotton',
        Fit: 'Slim Fit',
        Details: 'Genuine Mother-of-pearl buttons'
      },
      attributes: {
        colors: ['Oatmeal', 'Sage Green'],
        sizes: ['XS', 'S', 'M', 'L']
      }
    },
    {
      name: 'Miracle Sound ANC Headphones',
      slug: 'miracle-sound-headphones',
      description: 'Premium active noise-cancelling wireless headphones with custom high-fidelity drivers. Wrapped in brushed aluminum and genuine full-grain leather for maximum elegance and comfort.',
      price: 399.00,
      compareAtPrice: 450.00,
      stock: 8,
      sku: 'MRC-AUD-ANC-09',
      categoryId: categories.men.id,
      brandId: brands.apple.id,
      isFeatured: true,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800'
      ],
      details: {
        Battery: 'Up to 38 Hours (ANC On)',
        Driver: '40mm Custom Dynamic Transducers',
        Weight: '280g',
        Connectivity: 'Bluetooth 5.3 & Ultra-wideband'
      },
      attributes: {
        colors: ['Space Grey', 'Desert Gold', 'Chalk White'],
        sizes: ['One Size']
      }
    },
    {
      name: 'Organic Cotton Kids Dungarees',
      slug: 'organic-cotton-kids-dungarees',
      description: 'Charming dungarees crafted from soft, premium organic cotton canvas. Features adjustable shoulder straps, side buttons for easy dressing, and a front patch pocket.',
      price: 45.00,
      compareAtPrice: 60.00,
      stock: 30,
      sku: 'MRC-KID-DUN-03',
      categoryId: categories.kids.id,
      brandId: brands.miracle.id,
      isFeatured: true,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=800',
        'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800'
      ],
      details: {
        Material: '100% Organic Cotton Canvas',
        Origin: 'Made in Portugal',
        Fit: 'Standard Kids Fit',
        Care: 'Machine Wash Warm'
      },
      attributes: {
        colors: ['Sage Green', 'Warm Mustard', 'Rust Clay'],
        sizes: ['1-2Y', '2-3Y', '3-4Y', '4-5Y']
      }
    },
    {
      name: 'Minimalist Leather Trainer',
      slug: 'minimalist-leather-trainer',
      description: 'Timeless white low-top trainers made from durable, premium Nappa leather. Set on reinforced margom rubber soles for extreme longevity, completed with matching flat cotton laces.',
      price: 240.00,
      compareAtPrice: 280.00,
      stock: 14,
      sku: 'MRC-SH-TRAIN-05',
      categoryId: categories.footwear.id,
      brandId: brands.nike.id,
      isFeatured: true,
      rating: 4.5,
      images: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800'
      ],
      details: {
        Upper: '100% Nappa Leather',
        Sole: 'Margom Italian Rubber Sole',
        Lining: 'Calfskin Leather Lining'
      },
      attributes: {
        colors: ['Premium White', 'Off-Black'],
        sizes: ['US 8', 'US 9', 'US 10', 'US 11']
      }
    },
    {
      name: 'Signature Leather Tote',
      slug: 'signature-leather-tote',
      description: 'A spacious structural tote bag crafted with pebbled Italian calfskin. Features double hand handles, a magnetic main closure, and a raw suede interior with a zipped wallet pocket.',
      price: 450.00,
      compareAtPrice: null,
      stock: 5,
      sku: 'MRC-BG-TOTE-07',
      categoryId: categories.women.id,
      brandId: brands.miracle.id,
      isFeatured: true,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800',
        'https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=800'
      ],
      details: {
        Dimensions: '35cm x 40cm x 15cm',
        Material: 'Full-Grain Italian Calfskin',
        Compartments: '1 Main Compartment, 1 Detachable Internal Pocket'
      },
      attributes: {
        colors: ['Tan Gold', 'Matte Black', 'Taupe Grey'],
        sizes: ['Standard']
      }
    },
    {
      name: 'Ceramic Candle Ensemble',
      slug: 'ceramic-candle-ensemble',
      description: 'Three hand-thrown ceramic jars filled with non-toxic soy wax. Scents include Bergamot & Cedar, Sandalwood Silk, and Vetiver Smoke, designed to burn slowly and evenly.',
      price: 95.00,
      compareAtPrice: 120.00,
      stock: 20,
      sku: 'MRC-HM-CNDL-08',
      categoryId: categories.women.id,
      brandId: brands.miracle.id,
      isFeatured: false,
      rating: 4.4,
      images: [
        'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800'
      ],
      details: {
        WaxType: '100% Organic Soy Wax',
        BurnTime: '45 Hours per candle jar',
        Vessels: 'Reusable ceramic pottery'
      },
      attributes: {
        colors: ['Mixed Glaze'],
        sizes: ['Pack of 3']
      }
    }
  ];

  for (const productInfo of productsData) {
    const product = await prisma.product.create({
      data: productInfo,
    });

    // Seed inventory log
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        quantityChanged: product.stock,
        type: 'RESTOCK',
        reason: 'Initial Database Seed Restock',
      },
    });

    // Seed a couple of reviews for each product
    await prisma.review.create({
      data: {
        userId: customerUser.id,
        productId: product.id,
        rating: 5,
        title: 'Absolutely Exquisite',
        comment: `Highly recommend this product! The quality of the craftmanship is immediately apparent. Easily the best purchase I have made this season.`,
      },
    });

    await prisma.review.create({
      data: {
        userId: adminUser.id,
        productId: product.id,
        rating: 4,
        title: 'Premium Quality',
        comment: 'Beautiful design. Shipping took two extra days but the customer care team was incredibly helpful and updated me.',
      },
    });
  }

  // 3. Seed Coupons
  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10.0,
      minOrderValue: 50.0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'LUXURY50',
      discountType: 'FIXED',
      discountValue: 50.0,
      minOrderValue: 300.0,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });

  // 4. Seed Banners
  await prisma.banner.create({
    data: {
      title: 'Elevate Everyday Living',
      subtitle: 'Discover premium products crafted with elegance and quality.',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
      linkUrl: '/shop',
      position: 1,
    },
  });

  await prisma.banner.create({
    data: {
      title: 'The Sound of Silence',
      subtitle: 'Experience acoustic perfection with our new active noise cancelling headphones.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200',
      linkUrl: '/product/miracle-sound-headphones',
      position: 2,
    },
  });

  // 5. Seed Blogs
  await prisma.blogPost.create({
    data: {
      title: 'The Art of Essentialism in Design',
      slug: 'art-of-essentialism-design',
      summary: 'Exploring why clean lines, premium raw materials, and spaciousness compose the ultimate standard of luxury.',
      content: '<p>In a world of constant noise, subtraction is the ultimate luxury. Premium brands understand that a design is complete not when there is nothing left to add, but when there is nothing left to remove.</p><p>By prioritizing raw textures—Mongolian cashmere, vegetable-tanned calfskin, hand-turned clays—the products in the MIRACLE Studio collection stand on their own merit. There are no loud logos or transient design fads. The aesthetics are anchored in architectural proportions and timeless neutral palettes.</p>',
      coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
      authorId: adminUser.id,
      category: 'Design Philosophy',
      tags: ['Minimalism', 'Luxury', 'COS', 'Architecture'],
      readTime: '4 min read',
    },
  });

  await prisma.blogPost.create({
    data: {
      title: 'A Guide to Styling Premium Whites',
      slug: 'styling-premium-whites',
      summary: 'How to combine textures, ivory accents, and off-white drapery for a timeless seasonal wardrobe.',
      content: '<p>Monochromatic wardrobes communicate effortless sophistication. However, styling all-white outfits requires an attention to texture contrast to prevent flat silhouettes.</p><p>Pairing heavy knits like our Silk Ribbed Cardigan with flowing linen trousers or layering structured cashmere coats over light white tees creates tactile variety. Keep footwear minimalist with our Nappa Leather Trainers to ground the outfit.</p>',
      coverImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
      authorId: adminUser.id,
      category: 'Styling',
      tags: ['Fashion', 'Seasonal Lookbook', 'Styling Tips'],
      readTime: '3 min read',
    },
  });

  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed Error] Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
