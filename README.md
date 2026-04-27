# 3Dshop v2 — Immersive Supermarket & Logistics Suite

**3Dshop v2** is a premium, full-stack E-Commerce and Inventory Management platform built on top of v1 with a complete set of new features. It bridges the gap between traditional online shopping and immersive physical experiences with an automated entry system, real-time logistics tracking, AI-driven store analytics, and a glassmorphism-first design system.

---

## 🆕 What's New in v2 (Added on top of v1)

### 🏠 HomePage — Immersive Public Landing
- **Sticky Glassmorphism Navbar** with search, cart badge, notifications, and user avatar
- **Full-Screen Mobile Search Overlay** — spring-animated slide-up panel
- **Hero Section** with animated mesh background, dot-grid pattern, and live 3D scene card
- **Live Order Pill** — real-time active order status banner with shimmer animation
- **Trending Products Carousel** — horizontal snap-scroll with hover tilt cards
- **Category Grid** — dynamic department tiles pulled from live product data
- **Features Grid** — 6-feature showcase with icon cards and hover scale
- **Trust Strip** — Secure Checkout / Fast Delivery / Smart Catalog badges
- **Animated Stats** — 50k+ customers, 30min dispatch, 99.9% uptime
- **Premium Footer** — 4-column layout with department and support links

### 🚀 Final Polish & Security Hardening (Latest Updates)
- **Zero-Loading UI**: Removed all "circle-type" loading animations project-wide for an instant, responsive feel.
- **Multi-Tenant Isolation**: Hardened DB queries in `product`, `order`, `rack`, and `billing` controllers to ensure 100% data isolation between shops using `shopId` scoping.
- **RBAC Standardization**: Refined role hierarchy (`superadmin`, `admin`, `employee`, `shopper`) with granular `employeePermissions` support.
- **Team Management Portal**: New `/employees` interface for shop owners to invite staff and manage access rights.
- **POS & Search Optimization**: Removed loading states from the QR Scanner, Billing search, and HomePage search for zero-latency feedback.
- **Branding Loader Refinement**: Simplified the global splash screen by removing the legacy SVG ring animation.
- **Razorpay Live Ready**: Integrated production-grade payment flow with validated shop-specific credentials.

---

### 🌐 Landing Page — Feature Showcase
- Hero section with CTA buttons (Enter 3D Store / Browse Catalog)
- 3D preview card with animated store emoji
- 6-feature grid with color-coded icon cards
- Stats strip (10K+ products, 99.9% uptime, <2s load, 24/7 support)

### 🏪 Shop3D Page — Standalone Three.js Store
- Full-screen immersive 3D supermarket environment
- 9 product shelves with colored product boxes (Fruits, Bakery, Dairy, Vegetables, Pantry, Snacks, Beverages, Meat, Seafood)
- Floating animated logo (octahedron)
- Orbit controls (drag to rotate, scroll to zoom)
- HUD overlay with controls hint
- Category quick-nav bar at bottom
- Back and Shop Now buttons

### 🚛 Logistics Page — Admin Fleet Overview
- Live delivery stats cards (Active, Packed, Delivered, Total)
- Per-order delivery cards with full address, driver info, OTP status
- Visual 5-step timeline per order (Placed → Packed → Shipped → Out → Delivered)
- Urgent priority badge support
- OTP verified / pending badge display

### ❓ Help Center Page
- Full-text search across all FAQs
- 4 topic cards (Delivery, Payments, Orders, Account)
- Accordion FAQ with 6 pre-loaded questions
- Contact section (Live Chat, Email, Phone) with colored icons

### 🎬 BrandingLoader Component
- Animated splash screen shown during lazy-loaded page transitions
- Circular SVG ring with orange-to-purple gradient stroke animation
- 3D logo card with rotateY entrance animation
- Glowing atmosphere blur effect

### 🌐 Hero3DScene Component
- Three.js floating distorted sphere (MeshDistortMaterial)
- Wireframe octahedron accent shape
- Torus ring accent shape
- Used in HomePage hero card

### 📱 MobileBottomNav Component
- Fixed bottom navigation bar for shoppers on mobile
- 5 tabs: Home, Shop, Wishlist, Orders, Profile
- Animated active indicator (layoutId spring)
- Hidden on desktop (md:hidden)

### ✨ ParticleBackground Component
- Three.js 300-particle field with additive blending
- Slow rotation animation on both axes
- Used as optional decorative background layer

### 🔀 Smart Route Architecture
- All pages lazy-loaded with `React.lazy()` + `Suspense`
- `BrandingLoader` as universal Suspense fallback
- `Index.tsx` smart redirect: admins → `/dashboard`, shoppers → `/home`
- New public routes: `/home`, `/landing`, `/shop3d`, `/help`
- New admin route: `/logistics`
- `ProtectedRoute` uses `BrandingLoader` instead of inline spinner

### 🗂️ Zustand Cart Store (`lib/store.ts`)
- `useCartStore` with add, remove, updateQuantity, clearCart
- Computed `total()` and `count()` selectors

### 🪝 useAuth Hook (`hooks/useAuth.ts`)
- Convenience wrapper around `AuthContext`

### 🧭 Updated Sidebars
- **ShopperSidebar** — added Home, 3D Store, Help nav items with unique colors
- **AppSidebar (Admin)** — added Logistics route
- **AppLayout** — `MobileBottomNav` injected for shopper role, bottom padding for mobile

---

## 🔍 Additional Features (Discovered in Codebase)

### 👤 Multi-Address User Profiles
- Users can store multiple saved addresses (Home, Work, etc.)
- Each address has label, fullName, phone, street, landmark, city, state, postalCode
- One address can be marked as default (`isDefault: true`)
- Profile update supports name, email, mobile, shopName, and password change

### 📦 Product Variants & QR Codes
- Each product supports multiple variants (size, color, stock, price per variant)
- Every product has a unique `qrCode` field for scanner/POS integration
- Products track `totalRevenue` accumulated from all sales
- `minStockLevel` threshold triggers low-stock alerts in dashboard
- Products support `subCategory`, `brand`, `expiryDate`, `shelfNumber`, `columnNumber`

### 🧾 Auto-Numbered Invoice System
- Invoices are auto-numbered in format `INV-YYYYMMDD-0001`
- Creating an invoice automatically deducts stock and updates `totalRevenue` per product
- Billing stats API returns total, paid, and pending invoice amounts
- GST amount tracked separately per invoice

### 🏪 Multi-Shop Public Config API
- Shop config is per-admin (scoped by `shopId`)
- Public endpoint `/api/public/shop/:shopName` allows shoppers to load any shop by name
- `/api/shop-config/shops` returns list of all registered shop names
- Auto-creates default config if none exists for a shop

### 📊 Dashboard Intelligence
- Revenue growth % calculated dynamically (last 30 days vs prior 30 days)
- Order growth % calculated with same window comparison
- Inventory health score computed from low-stock ratio (0–100)
- AI suggestion auto-generated based on top-revenue category
- Top 5 products by revenue returned with current stock levels
- Daily revenue chart data for 30-day trajectory

### 🔐 Auth Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 10 login attempts per hour per IP (brute-force protection)
- Rate limit info returned in `RateLimit-*` response headers

### ⚡ Slow API Detection
- Every API response time is tracked via `responseTimeTracker` middleware
- Requests taking >1 second are logged as `SLOW API` warnings in Winston logs
- Includes method, URL, status code, and duration in the warning log

### 📦 Order Return & Refund Flow
- Shoppers can request return only on `Delivered` orders
- Return statuses: `Requested → Approved / Rejected → PickedUp → Refunded`
- Each return action is appended to `statusHistory` with timestamp
- Admin can handle return with approval/rejection and optional comment
- `refundId` field stored on order for payment reconciliation

### 🚚 Delivery Failure & Rescheduling
- Delivery staff can mark delivery as `Failed` or `Rescheduled`
- Failed/rescheduled status updates propagate via Socket.io to shopper in real-time
- `priority` field supports `Normal` and `Urgent` delivery tiers
- Delivery notes field for special instructions per order

---

## ✅ Features Carried Over from v1

### 🛒 Shopper Experience
- **Immersive 3D Shop Viewer** — spatial navigation with product locator and rack highlight
- **Universal Search Engine** — SKU-level search with rack highlighting (10s timer)
- **2D Floor Plan Toggle** — switch between 3D and 2D map view
- **Wishlist & Catalog** — save favorites, browse curated departments
- **User Profiles** — multiple shipping addresses, order history, preferences
- **Product Detail Pages** — full product info with add-to-cart

### 💳 Checkout & Payments
- **Multi-Step Checkout** — Address → Payment → Confirmation (3 steps)
- **Razorpay Integration** — UPI, Card, Netbanking
- **Cash on Delivery** — COD flow with DB order creation
- **GST Calculation** — 18% tax breakdown in order summary
- **Downloadable Invoice** — print-ready HTML invoice via `window.open()`
- **Order Confirmation Animation** — success screen with CheckCircle

### 🚛 Logistics & Delivery
- **Real-Time Order Tracking** — Ordered → Packed → Shipped → OutForDelivery → Delivered
- **WebSocket Live Updates** — Socket.io room-based order status sync
- **Delivery Assignment** — admin assigns staff, date, time slot, priority
- **OTP Delivery Verification** — 6-digit OTP generated on assignment, verified at doorstep
- **Delivery Person Details** — name and contact shown to shopper
- **Status History Timeline** — full timestamped journey per order

### 👥 Role-Based Dashboards
- **Admin Dashboard** — revenue charts, category pie, stat cards, 30-day trajectory
- **Staff Dashboard** — assigned deliveries, OTP verify, status controls
- **Shopper Dashboard** — order tracking, profile, purchase history

### 🏗️ 3D Shop Builder
- **X/Y/Z Coordinate Placement** — precision rack positioning with sliders
- **Custom Rack Dimensions** — width, height, shelves, columns
- **Door Management** — entry/exit portals with type, position, rotation
- **Real-Time 3D Preview** — live preview of new rack before saving
- **Shop Dimension Control** — set floor width and depth

### 📦 Scanner & POS
- **Dual-Mode QR Scanner** — Billing Mode and Inventory Mode
- **Camera-Based Scanning** — device camera integration
- **Thermal-Style Bill Generation** — print-ready bill output
- **Instant Stock Updates** — scan to adjust quantities

### 🧠 SmartStore AI Analytics
- **Traffic Distribution** — bar chart by store zone
- **Footfall Chronology** — area chart for peak hour prediction
- **Revenue Allocation** — donut chart by category
- **Zone Efficiency Matrix** — line chart for rack performance
- **AI Recommendation Banner** — primary insight from simulated CV engine
- **Re-Simulate Button** — refresh AI insights on demand

### 🛡️ Security & Backend
- **JWT Token Rotation** — 15-min access token + 7-day HttpOnly refresh token
- **Helmet.js** — HTTP security headers
- **Rate Limiting** — API-level request throttling
- **Mongo Sanitize + HPP** — injection and parameter pollution protection
- **Immutable Audit Logs** — actor, entity, payload tracking for all admin actions
- **Winston + Morgan Logging** — structured logs with slow-API detection (>1s)
- **Password Reset Flow** — OTP-based forgot password with email step

### 📋 Other Pages
- **Products** — admin CRUD with search, filter, stock management
- **Racks** — admin rack list with product assignment
- **Users** — admin user management with role control
- **Audit Logs** — paginated immutable activity log
- **Billing** — transaction overview and bill generation
- **Orders** — full order management with return/refund flow
- **Delivery Hub** — assign, track, verify all deliveries
- **Notifications** — real-time notification center
- **Categories & Deals** — shopper browsing pages
- **Cart** — add/remove/update quantities with totals
- **Wishlist** — save and manage favorite products
- **Profile** — manage addresses, account info, saved preferences
- **NotFound** — 404 page

## 🔐 Role-Based Access Control (RBAC)

The platform implements a multi-tenant security architecture where access is strictly governed by user roles and shop-specific isolation.

### 🛡️ Role Hierarchy & Permissions

| Role | Access Level | Primary Responsibilities |
| :--- | :--- | :--- |
| **Admin** | **Highest Access** | Full control over the shop: inventory, 3D layout, billing, team management, and shop configurations. |
| **Employee** | **Staff / Operational** | Handles day-to-day tasks like scanning (POS), order packing, and delivery fulfillment. |
| **Shopper** | **End Customer** | Browsing the 3D store, managing cart/wishlist, and tracking personal orders. |

### 🔑 Detailed Permission Map

#### 1. Admin (Administrator Level)
*   **Shop Management**: Full control over shop identity, branding, and active configurations.
*   **Inventory & Logistics**: Full CRUD on products, racks, and logistics fleet.
*   **3D Architectural Control**: Design the shop layout using the 3D Shop Builder.
*   **Team Governance**: Invite employees and manage granular **Employee Permissions**.
*   **Financials**: Access the Billing Suite, Revenue Charts, and platform analytics.

#### 2. Employee (Staff Level)
*   **Operational Access**: Use the QR Scanner for inventory checks or billing.
*   **Order Fulfillment**: Update order statuses (Packed, Shipped) based on assigned permissions.
*   **Delivery Management**: Handle last-mile delivery and verify OTPs at the doorstep.
*   *Note: Specific access is toggled by the Admin in the Employee Management portal.*

#### 3. Shopper (Public Level)
*   **Spatial Commerce**: Explore the 3D Shop, use the product locator, and view 2D floor plans.
*   **Personalization**: Manage multiple delivery addresses, wishlists, and order history.
*   **Secure Checkout**: Place orders via Razorpay or COD and download digital invoices.

---

## 🛠️ Technology Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript + Vite |
| 3D Engine | Three.js + @react-three/fiber + @react-three/drei |
| Styling | Tailwind CSS + custom design tokens |
| Animation | Framer Motion (micro-interactions, page transitions) |
| State | Zustand (cart store) |
| Data Fetching | TanStack React Query |
| Real-Time | Socket.io-client |
| Charts | Recharts |
| Routing | React Router v6 (lazy + Suspense) |
| UI Components | Radix UI + shadcn/ui |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + Express.js + TypeScript |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (access + refresh) + bcrypt |
| Real-Time | Socket.io |
| Security | Helmet + mongo-sanitize + HPP + rate-limit |
| Logging | Winston + Morgan |
| Payments | Razorpay |

---

## 📁 Project Structure

```
appv2/
├── Frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/               # shadcn/ui primitives
│       │   ├── AppLayout.tsx     # Main shell with sidebar + mobile nav
│       │   ├── AppSidebar.tsx    # Admin sidebar
│       │   ├── ShopperSidebar.tsx# Shopper sidebar
│       │   ├── BrandingLoader.tsx# ✨ NEW — Splash screen loader
│       │   ├── Hero3DScene.tsx   # ✨ NEW — Three.js hero orb
│       │   ├── MobileBottomNav.tsx# ✨ NEW — Mobile tab bar
│       │   ├── ParticleBackground.tsx # ✨ NEW — Particle field
│       │   ├── Navbar.tsx        # Top navbar (guest/login)
│       │   ├── OrderTimeline.tsx # Order status timeline
│       │   └── PageTransition.tsx# Route transition wrapper
│       ├── pages/
│       │   ├── HomePage.tsx      # ✨ NEW — Immersive public landing
│       │   ├── Landing.tsx       # ✨ NEW — Feature showcase
│       │   ├── Shop3D.tsx        # ✨ NEW — Standalone 3D store
│       │   ├── Logistics.tsx     # ✨ NEW — Admin fleet overview
│       │   ├── HelpCenter.tsx    # ✨ NEW — FAQ & support
│       │   ├── ShopViewer.tsx    # 3D shop with search & rack highlight
│       │   ├── ShopBuilder.tsx   # Admin 3D store builder
│       │   ├── Dashboard.tsx     # Admin analytics dashboard
│       │   ├── SmartStore.tsx    # AI analytics explorer
│       │   ├── Delivery.tsx      # Delivery hub (all roles)
│       │   ├── Orders.tsx        # Order management
│       │   ├── Checkout.tsx      # Multi-step checkout
│       │   ├── Scanner.tsx       # QR/barcode scanner + POS
│       │   ├── Billing.tsx       # Billing suite
│       │   ├── AuditLogs.tsx     # Immutable audit trail
│       │   └── ...               # Cart, Wishlist, Profile, etc.
│       ├── hooks/
│       │   ├── useAuth.ts        # ✨ NEW — Auth context hook
│       │   └── useSocket.ts      # Socket.io hook
│       ├── lib/
│       │   ├── store.ts          # ✨ NEW — Zustand cart store
│       │   ├── api.ts            # Axios instance + JWT refresh interceptor
│       │   └── razorpay.ts       # Razorpay SDK loader
│       └── context/
│           └── AuthContext.tsx   # Auth provider + JWT session check
└── Backend/
    ├── controllers/              # Business logic per domain
    ├── models/                   # Mongoose schemas
    ├── routes/                   # Express route handlers
    ├── middleware/               # auth, audit, security
    └── server.ts                 # Express + Socket.io entry point
```

---

## 🚀 Quick Start

```bash
# 1. Backend
cd appv2/Backend
npm install
# configure .env (MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
npm run dev        # runs on http://localhost:5000 in dev, https://threedshop-38fd.onrender.com in prod

# 2. Frontend
cd appv2/Frontend
npm install
npm run dev        # runs on http://localhost:5173
```

### Environment Variables (Backend `.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/3dshop
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
NODE_ENV=development
```

### Environment Variables (Frontend `.env`)
```env
API_URL=https://threedshop-38fd.onrender.com/api
RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## 🔗 Route Map

| Route | Access | Page |
|-------|--------|------|
| `/` | Public | CustomerSearch (admin) |
| `/home` | Public | ✨ HomePage — immersive landing |
| `/landing` | Public | ✨ Landing — feature showcase |
| `/shop3d` | Public | ✨ Shop3D — standalone 3D store |
| `/help` | Public | ✨ HelpCenter — FAQ & support |
| `/login` | Public | Login / Register |
| `/shop-viewer` | Public | 3D Shop Viewer with search |
| `/catalog` | Shopper | Product catalog |
| `/product/:id` | Shopper | Product detail |
| `/categories` | Shopper | Category browser |
| `/deals` | Shopper | Deals & offers |
| `/cart` | Shopper | Shopping cart |
| `/checkout` | Shopper | Multi-step checkout |
| `/wishlist` | Shopper | Saved products |
| `/orders` | Shopper/Admin | Order management |
| `/delivery` | All roles | Delivery hub |
| `/profile` | Shopper | Account & addresses |
| `/notifications` | Shopper | Notification center |
| `/dashboard` | Admin | Analytics dashboard |
| `/products` | Admin | Product management |
| `/racks` | Admin | Rack management |
| `/shop-builder` | Admin | 3D store builder |
| `/scanner` | Admin | QR scanner + POS |
| `/smartstore` | Admin | AI analytics |
| `/billing` | Admin | Billing suite |
| `/logistics` | Admin | ✨ Fleet overview |
| `/users` | Admin | User management |
| `/employees` | Admin | ✨ Team & Permissions |
| `/superadmin/dashboard` | SuperAdmin | ✨ Global platform control |
| `/audit-logs` | Admin | Audit trail |

---

## 📱 Mobile App (3Dshop Mobile)
The mobile version of 3Dshop is built using **Expo (React Native)**. It provides a native wrapper around the web experience, ensuring a fast and installable app (APK/IPA) for customers.

### Features
- **WebView Integration** — Loads the full 3D store experience in a native container
- **APK Ready** — Can be built for Android distribution
- **Fast Performance** — Lightweight wrapper with direct API potential

### How to Run
```bash
cd 3dshop-app
npx expo start
```
Scan the QR code in the **Expo Go** app on your phone.

---

## 🏗️ Startup Architecture (Production Ready)
We follow the "One Backend" rule to minimize maintenance and maximize scale:

1. **Frontend (Website)** → **Vercel**
2. **Mobile App (Android/iOS)** → **Expo**
3. **Backend API (Node.js)** → **Render**
4. **Database (Cloud)** → **MongoDB Atlas**

---

© 2026 **3Dshop Premium Suite v2**. All Rights Reserved. Crafted for the future of spatial commerce.
