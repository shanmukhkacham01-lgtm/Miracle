# MIRACLE — Luxury Minimalist E-Commerce Platform

A production-ready, full-stack, responsive e-commerce web application designed with high-contrast, premium, spacious styling inspired by Apple, Zara, COS, and Nike Lab.

---

## 🏛️ Project Directory Structure

```
miracle/
├── client/                     # Next.js App Router Frontend
│   ├── public/                 # Logos, favicons, robots.txt
│   ├── src/
│   │   ├── app/                # Layouts, Providers, Home, Shop, Details, Checkout, Dashboard, Admin
│   │   ├── components/         # Header, Footer, CartDrawer, ProductCard, LiveChat
│   │   ├── store/              # Redux state (Cart, currency, themes, language)
│   │   └── utils/              # Axios instance with JWT auth interceptors
│   ├── tailwind.config.ts      # Custom theme configurations
│   └── package.json
├── server/                     # Node.js + Express + Prisma REST API Backend
│   ├── prisma/
│   │   ├── schema.prisma       # 15+ PostgreSQL tables
│   │   └── seed.ts             # Rich catalog & user seeder
│   ├── src/
│   │   ├── controllers/        # MVC Business logic handlers
│   │   ├── middleware/         # Security headers, auth gates, rate limiters, global error catches
│   │   ├── routes/             # REST endpoints (auth, cart, orders, admin, blogs)
│   │   ├── services/           # PDFkit invoice generator, Cloudinary uploads, Stripe/Razorpay
│   │   └── app.ts              # Express initialization
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml          # PostgreSQL container launcher
├── logo.svg                    # STANDALONE branding logo
├── favicon.svg                 # Branding favicon
└── README.md                   # This document
```

---

## 🎨 Luxury Design Language

- **Colors**:
  - Background: `#FAFAF8` (Warm Off-white)
  - Cards: `#FFFFFF`
  - Text: `#111111` (High contrast charcoal)
  - Muted Text: `#666666`
  - Borders: `#E8E8E8`
  - Accent: `#C8A97E` (Soft Gold)
  - Success: `#22C55E`
  - Danger: `#EF4444`
- **Typography**:
  - Headings & Branding: `Playfair Display` (Serif)
  - Body: `Inter` (Clean sans-serif)
- **Borders & Radii**:
  - Corner Roundedness: `12px` (Slightly curved)
  - Shadows: Soft luxury filters (0 4px 20px -2px rgba(17,17,17,0.04))

---

## 🚀 Setup & Launch Pipelines

### Prerequisites
- [Node.js v18+](https://nodejs.org)
- [Docker](https://www.docker.com/) (to run PostgreSQL database locally)

### 1. Database Setup
Spin up the local PostgreSQL container using Docker Compose:
```bash
docker-compose up -d
```
*This starts a PostgreSQL instance on port `5432` with user `miracle_user` and database `miracle_db`.*

### 2. Configure Backend Server
Navigate to the server directory:
```bash
cd server
```

Install Node dependencies:
```bash
npm install
```

Generate Prisma Client and apply migrations:
```bash
# Generate TypeScript types
npm run prisma:generate

# Apply PostgreSQL schemas and migrations
npm run prisma:migrate
```

Seed the catalog:
```bash
npm run prisma:seed
```
*This populates the database with: an Admin account (`admin@miracle.luxury`), a customer user (`user@miracle.luxury`), 7 luxury products, blog posts, vouchers, and reviews.*
Default password for both seeded accounts is `password123`.

Start the backend in development mode:
```bash
npm run dev
```
*The API server will launch at http://localhost:5000.*

### 3. Configure Frontend Client
Navigate to the client directory in a new terminal window:
```bash
cd client
```

Install React dependencies:
```bash
npm install
```

Start the Next.js development server:
```bash
npm run dev
```
*The React client will launch at http://localhost:3000.*

---

## 🔐 Credentials & Fallback Modes
If external keys (Stripe, Razorpay, Cloudinary) are not supplied in the environment variables, the system **automatically enables simulation fallbacks**:
- **Stripe/Razorpay**: Checkout processes transaction mock records (`mock_ch_...`) seamlessly, granting immediate order confirmation.
- **UPI**: Renders a mockup QR Code barcode.
- **Cloudinary**: File uploads fall back to storing images in local backend server folders (`/uploads`) and serving them statically.
- **SMTP**: Email dispatches are logged to the console and stored inside `server/logs/notifications.log` for easy developer diagnostics.
