# Himalaya Enterprises - Interactive Business Platform

## Company Overview

**Himalaya Enterprises** is a premier automobile body manufacturing company headquartered in the Industrial Area, Adityapur, Jamshedpur, Jharkhand (831013). Founded in 2009, the company has built a strong reputation for manufacturing durable, high-quality automobile bodies for commercial vehicles.

**CEO & Founder:** Rajeev Shukla

### Key Stats
- **15+ Years** of manufacturing experience
- **10,000+ Vehicles** built and delivered
- **500+ Happy Clients** across Eastern India
- **15,000 sq.ft.** manufacturing facility

---

## Product Categories

### 1. Tippers
Heavy-duty tipper bodies designed for mining, construction, and transportation industries.

| Product | Capacity | Material | Price Range | Image |
|---------|----------|----------|-------------|-------|
| 6-Wheeler Tipper Body | 10 cubic meters | Mild Steel | ₹1,85,000 - ₹2,30,000 | tipper-1.jpg |
| 10-Wheeler Tipper Body | 16 cubic meters | High-Tensile Steel | ₹2,85,000 - ₹3,50,000 | tipper.jpg |
| 12-Wheeler Tipper Body | 22 cubic meters | Hardox Steel | ₹4,20,000 - ₹5,20,000 | tip-trailor.jpg |

**Features:** Hydraulic lift system, reinforced floor plates, side wall reinforcements, anti-rust coating.

### 2. Trailers
Flatbed, low-bed, and skeletal trailers for logistics and heavy equipment transport.

| Product | Payload | Key Feature | Price Range | Image |
|---------|---------|-------------|-------------|-------|
| 40ft Flatbed Trailer | 35 tons | Multi-axle suspension | ₹5,50,000 - ₹7,00,000 | flat-bed-trailor.jpg |
| Low-Bed Trailer | 60 tons | Hydraulic ramps | ₹8,50,000 - ₹11,00,000 | tip-trailor-2.jpg |
| Skeletal Container Trailer | 30 tons | 20/40ft compatible | ₹3,80,000 - ₹4,80,000 | container-bodies.jpg |

**Features:** Twist locks, air brake systems, LED lighting, powder-coated finish.

### 3. Tractor Bodies
Custom tractor body fabrication for agricultural and industrial use.

| Product | Capacity | Use Case | Price Range | Image |
|---------|----------|----------|-------------|-------|
| Tractor Trolley Body | 8 tons | Agricultural | ₹1,20,000 - ₹1,60,000 | tractor-trolley.jpg |
| Heavy Tractor Chassis | 50+ HP | Industrial | ₹95,000 - ₹1,40,000 | tractor-trolley.jpg |

**Features:** Hydraulic tipping mechanism, PTO compatibility, agricultural-grade construction.

### 4. Water Tanks
Industrial and commercial water storage and transport solutions.

| Product | Capacity | Material Options | Price Range | Image |
|---------|----------|-----------------|-------------|-------|
| 5,000L Water Tank | 5,000 liters | MS / SS304 | ₹95,000 - ₹1,30,000 | 5k-water-tanker.jpg |
| 10,000L Water Tank | 10,000 liters | MS / SS304 | ₹1,75,000 - ₹2,50,000 | 10K-water-tanker.jpeg |
| 20,000L Water Tanker | 20,000 liters | MS (vehicle-mounted) | ₹3,20,000 - ₹4,20,000 | 20k-water-tanker.jpeg |

**Features:** Spray systems, baffles for slosh reduction, food-grade options available.

### 5. Custom Fabrication
Any automobile body customization on demand.

| Product | Key Feature | Price Range | Image |
|---------|-------------|-------------|-------|
| Custom Truck Body | Built to specification | ₹2,00,000 - ₹8,00,000 | container-bodies.jpg |
| Crane Body Fabrication | Structural certification | ₹4,50,000 - ₹9,00,000 | — |
| Hydraulic Tipper Kit | Retrofit 15-ton | ₹85,000 - ₹1,20,000 | tip-trailor-34cum.jpg |

---

## Website Pages & Use Cases

### 1. Landing Page (`index.html`)

**Use cases:**
- First impression for visitors — full-bleed hero with company tagline and CTA buttons
- Browse product categories via interactive image tiles (5 categories)
- View company stats (animated counters: 15+ Years, 10,000+ Vehicles, 500+ Clients, 15,000 sq.ft.)
- Preview featured products (8 products shown with images, specs, pricing, and stock status)
- See scrolling image gallery strip of all product types
- Read "Why Choose Us" feature highlights (quality, customization, experience, support)
- Understand the business process (Browse → Inquire → Manufacture → Deliver)
- Read customer testimonials
- Quick access to catalog, contact, and inquiry submission

**Visual features:**
- Full-bleed hero with parallax scrolling background image (`tipper.jpg`)
- Trust bar with certification badges (ISO 9001, ARAI, RTO Approved)
- Category showcase grid with hover zoom effect on image tiles
- Animated stat counters (triggered by scroll via IntersectionObserver)
- Infinite-scrolling gallery strip (CSS keyframe animation, pauses on hover)
- Process steps with numbered connectors
- Full-bleed CTA section with background image (`tip-trailor-34cum.jpg`)

### 2. Product Catalog (`pages/catalog.html`)

**Use cases:**
- Browse all 14 products with real product images
- Filter by category: Tippers | Trailers | Tractors | Water Tanks | Custom
- Search products by name or specifications (live filtering)
- Toggle between grid and list view
- Check stock availability per product (In Stock / In Production / Made to Order)
- View product details in a modal dialog (enlarged image, full specs, pricing)
- Add products to inquiry basket for quotation requests
- Request a quote on individual products

**Visual features:**
- Full-bleed hero header with background image (`tip-trailor.jpg`, 45vh)
- Product cards with real images (`object-fit: cover`, 220px height)
- Color-coded stock badges (green/yellow/red)
- Bottom CTA section with background image

### 3. About Page (`pages/about.html`)

**Use cases:**
- Learn the company story, mission, and values
- View CEO Rajeev Shukla's profile with photo (`rajeev_shukla.jpeg`)
- See CEO achievements, education, experience, and professional associations
- View manufacturing capabilities (CNC cutting, welding, paint, testing, assembly)
- Check certifications (ISO 9001:2015, ARAI Compliant, RTO Approved)
- Browse product gallery strip
- Navigate to contact or catalog from CTA section

**Visual features:**
- Full-bleed hero with background image (`tipper-1.jpg`)
- Company story grid with stacked product images
- Stats counter bar (15+ Years, 10,000+ Vehicles, 500+ Clients, 15,000 sq.ft.)
- Mission & values cards (features-grid-v2 layout)
- CEO section with left column (photo + sticky sidebar info card with stats: 20+ Years experience, 10K+ Vehicles, 2009 Founded, location, education, association) and right column (bio, vision, achievements grid)
- Scrolling gallery strip
- Capabilities section with icon cards
- Certifications grid
- Full-bleed CTA section

### 4. Contact Page (`pages/contact.html`)

**Use cases:**
- Contact the company via form (name, email, phone, product interest, message)
- Find company location on embedded Google Maps
- Quick contact via WhatsApp button
- Call directly using phone number links
- Send email via mailto links
- Check business hours

**Visual features:**
- Full-bleed hero with background image (`tip-trailor-2.jpg`)
- 4 floating quick-contact cards (Phone, Email, WhatsApp, Location) overlapping hero
- Side-by-side layout: contact form (left) + map/WhatsApp/product image (right)
- WhatsApp card with direct chat link
- Product image card within contact section
- Full-bleed CTA at bottom (`flat-bed-trailor.jpg`)

### 5. Buyer Dashboard (`pages/buyer.html`)

**Use cases:**
- View personalized product recommendations
- Manage inquiry basket (add/remove products, adjust quantities)
- Submit inquiries to Himalaya Enterprises
- Submit RFQ (Request for Quotation) for custom work with detailed specifications
- Track order history with full status timeline
- View and manage saved/favorite products
- See order summary and total values
- Issue Purchase Orders and download PO as PDF
- Download PO PDF for any order with status po_issued or later
- Confirm advance payment with amount and UTR/transaction reference (status: po_issued → advance_paid)
- Receive and review invoices raised by supplier against PO
- Record Goods Receipt (GRN) with date, condition, and remarks (status: dispatched → delivered)
- Perform quality inspection and approve/reject received goods (status: delivered → qc_approved / disputed)
- Release balance payment after QC approval; balance auto-calculated as (PO Total - Advance Paid) (status: qc_approved → completed)

### 6. Supplier Dashboard (`pages/supplier.html`)

**Use cases:**
- Add new products (name, category, specs, price range, stock quantity, images)
- Edit existing product details
- Delete products from catalog
- Update stock levels in real-time
- View and manage incoming inquiries and RFQs
- Update order/production status through the full lifecycle
- View analytics overview (total products, pending orders, revenue, total inquiries)
- Download Purchase Order PDF for orders with status po_issued or later
- Create and send invoices against Purchase Orders (with GST rates, line items, HSN code, place of supply, payment terms)
- Record dispatch with delivery challan details (dispatch date, vehicle number, challan number, transporter)
- View buyer's GRN acknowledgment and QC inspection results
- Track payment status (advance received, balance pending/received)
- Respond to disputes raised by buyer after QC rejection

---

## Interactive UX Features

### Navigation & Layout
- Responsive navigation bar with mobile hamburger menu
- Smooth scroll to sections from navigation links
- Back-to-top floating button
- Floating WhatsApp chat button on all pages
- Consistent footer with company info, quick links, and social media

### Visual Effects
- **Parallax scrolling** — hero background image translates on scroll via `transform: translateY()`
- **Scroll animations** — elements animate in (fade/slide) when scrolled into view (IntersectionObserver API)
- **Animated counters** — stat numbers count up with ease-out cubic easing when visible
- **Gallery strip** — infinite horizontal scroll of product images via CSS `@keyframes`
- **Category tile hover** — zoom effect via `transform: scale(1.08)` with gradient overlay
- **Loading skeletons** — placeholder animations while content loads

### Theme & Accessibility
- **Dark/Light mode toggle** with localStorage persistence across sessions
- Responsive design for all screen sizes (mobile-first, 375px+)
- High-contrast text on image overlays via gradient backgrounds

### User Feedback
- Toast notifications for all user actions (add to cart, submit inquiry, login, etc.)
- Modal dialogs for product quick views with full details
- Form validation with real-time error feedback
- Confirmation dialogs for destructive actions

---

## Platform User Guide

### For Buyers

1. **Browse Products**: Visit the Product Catalog page to see all available products. Use category filters (Tippers, Trailers, Tractors, Water Tanks, Custom) and the search bar to find what you need.

2. **Check Availability**: Each product shows its stock status:
   - **In Stock** (green) — Available for immediate delivery
   - **In Production** (yellow) — Currently being manufactured
   - **Made to Order** (red) — Will be manufactured on order

3. **View Product Details**: Click on any product card to open a modal with enlarged image, full specifications, pricing, and action buttons.

4. **Add to Inquiry Basket**: Click "Add to Inquiry" on any product to add it to your inquiry basket. This works like a cart but for quotation requests.

5. **Submit Inquiry**: Open your inquiry basket and click "Submit Inquiry" to send your request to the Himalaya team.

6. **Request for Quotation (RFQ)**: For custom work, go to the Buyer Dashboard and use the "Request Quote" form. Describe your specifications and requirements in detail.

7. **Track Orders**: All your inquiries and RFQs are visible in the "My Orders" section of your dashboard with status tracking (Pending → Confirmed → In Progress → Completed).

8. **Save Favorites**: Click the heart icon on products to save them for later reference.

### For Suppliers

1. **Login**: Use supplier credentials to access the Supplier Dashboard.

2. **Add Products**: Navigate to "Add Product" to list new products with name, category, specifications, pricing, and stock quantity.

3. **Manage Stock**: Use the "Stock" button next to each product to update inventory levels in real-time.

4. **Edit/Delete Products**: Modify product details or remove products from the catalog.

5. **Manage Orders**: View all incoming inquiries and RFQs. Update order status (Pending → Confirmed → In Progress → Completed).

6. **Analytics**: The overview dashboard shows total products, pending orders, revenue from completed orders, and total inquiries.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Supplier | admin@himalayaentp.com | admin123 |
| Buyer | ramesh@example.com | buyer123 |
| Buyer | suresh@example.com | buyer123 |

---

## Business Exchange Workflow

### Full Procure-to-Pay (P2P) Lifecycle

```
PHASE 1: SOURCING & NEGOTIATION (implemented)
─────────────────────────────────────────────
Buyer browses catalog → views product images, specs, pricing
    ↓
Adds products to inquiry basket / submits RFQ for custom work
    ↓
Inquiry submitted → Status: Pending
    ↓
Supplier reviews inquiry in dashboard
    ↓
Supplier sends quote → Buyer negotiates (counter-offers) → Agreement
    ↓
Buyer accepts quote → Status: Accepted
    ↓
Buyer issues Purchase Order → Status: PO Issued → PDF auto-downloads
Both buyer and supplier can download the PO PDF at any time after issuance.

PHASE 2: FULFILLMENT & INVOICING (implemented)
──────────────────────────────────────────
Buyer pays advance (amount entered by buyer, suggested 50%) → Status: Advance Paid
    ↓ (advance amount stored in orders.advance_paid)
Manufacturing begins → Status: In Progress
    ↓
Supplier creates Invoice against PO (with GST, line items, payment terms)
    → Status: Invoiced
    ↓
Supplier dispatches goods (records dispatch date, vehicle/challan number)
    → Status: Dispatched

PHASE 3: RECEIPT, INSPECTION & PAYMENT (implemented)
─────────────────────────────────────────────────
Buyer receives goods → creates GRN (Goods Receipt Note)
    → Status: Delivered
    ↓
Buyer performs Quality Inspection
    - Dimensional checks, weld quality, paint, hydraulics
    - Approve / Reject with remarks
    ↓
If QC approved → Status: QC Approved
    ↓
Buyer releases balance payment (Total - Advance Paid = Balance Due)
    → Status: Completed (balance amount stored in orders.balance_paid)
    ↓
If QC rejected → Buyer raises dispute with remarks
    → Status: Disputed → Supplier responds with dispute_response
```

### Order Status Pipeline

| # | Status | Set By | Description |
|---|--------|--------|-------------|
| 1 | `pending` | System | Inquiry/RFQ submitted by buyer |
| 2 | `quoted` | Supplier | Supplier sends first quote |
| 3 | `negotiating` | Either | Counter-offers exchanged |
| 4 | `accepted` | Buyer | Buyer accepts final price |
| 5 | `po_issued` | Buyer | Formal Purchase Order generated (PDF) |
| 6 | `advance_paid` | Buyer | Advance payment confirmed (amount stored in orders.advance_paid) |
| 7 | `in-progress` | Supplier | Manufacturing/fabrication started |
| 8 | `invoiced` | Supplier | Invoice raised against PO (GST-compliant with line items) |
| 9 | `dispatched` | Supplier | Goods shipped with delivery challan (vehicle, date, challan no.) |
| 10 | `delivered` | Buyer | Buyer records GRN — goods received (date, condition, remarks) |
| 11 | `qc_approved` | Buyer | Quality inspection passed |
| 12 | `completed` | Buyer | Balance payment released (balance = total - advance), order closed |
| — | `cancelled` | Either | Order cancelled at any pre-dispatch stage |
| — | `disputed` | Buyer | QC failed, dispute raised for resolution |

### Key Documents in the Workflow

| Document | Generated By | When | Purpose |
|----------|-------------|------|---------|
| **Purchase Order (PO)** | System (PDF) | Buyer issues PO | Formal commitment to buy at agreed price |
| **Invoice** | Supplier | After production / before dispatch | GST-compliant tax invoice for payment |
| **Delivery Challan** | Supplier | At dispatch | Proof of shipment, vehicle & transport details |
| **GRN (Goods Receipt Note)** | Buyer | On receiving goods | Formal acknowledgment of receipt |
| **QC Report** | Buyer | After inspection | Accept/reject with inspection remarks |
| **Payment Receipt** | System | On payment confirmation | Record of advance & balance payments |

### Payment Flow (Implemented)

**Advance Payment (Buyer → Supplier):**
- Triggered when order status is `po_issued`
- Buyer enters advance amount (placeholder suggests 50% of PO value) and optional UTR/transaction reference
- Backend stores amount in `orders.advance_paid` column and transitions status to `advance_paid`
- Role-restricted: only buyers can send `advance_payment` messages

**Balance Payment (Buyer → Supplier):**
- Triggered when order status is `qc_approved` (after goods received and QC passed)
- UI displays: `Advance Paid: ₹X | Balance Due: ₹(Total - Advance)`
- Balance amount auto-calculated: `PO Total Value - Advance Paid`
- Backend stores amount in `orders.balance_paid` column and transitions status to `completed`
- Role-restricted: only buyers can send `balance_payment` messages

**Invoice PDF Payment Display:**
- Invoice PDF shows `Advance Received: ₹X | Balance Due: ₹(Grand Total - Advance Paid)`
- Payment terms displayed from invoice record (default: "50% advance, 50% on delivery after QC")

**Database Columns (orders table):**
- `advance_paid NUMERIC(14,2) DEFAULT 0` — stores advance payment amount
- `balance_paid NUMERIC(14,2) DEFAULT 0` — stores balance payment amount

**Invoice vs PO Validation (Implemented):**
- Server rejects invoice if subtotal exceeds PO value by more than 5% tolerance
- Error message shows exact amounts: invoice subtotal, PO value, and maximum allowed
- 5% tolerance accounts for minor tax/transport adjustments
- Supplier invoice form displays the PO value being invoiced against for transparency

### Payment Terms (Default)
- **50% advance** on PO issuance
- **50% balance** on delivery after QC approval
- Prices inclusive of fabrication; transport extra
- PO valid for 30 days from date of issue
- Disputes subject to Patna jurisdiction

---

## CEO & Leadership

### Rajeev Shukla — CEO & Founder

Rajeev Shukla is the visionary founder of Himalaya Enterprises. Born and raised in Jamshedpur, India's steel city, he has deep roots in the industrial manufacturing sector.

**Photo:** `assets/rajeev_shukla.jpeg`

**Background:**
- Engineering graduate with specialization in mechanical engineering
- Over 20 years of experience in automobile body manufacturing
- Founded Himalaya Enterprises in 2009 with a 3-person team

**Achievements:**
- Grew the company from a small workshop to a 15,000 sq.ft. manufacturing facility
- Manufactured 10,000+ vehicle bodies for clients across Eastern India
- Introduced Hardox steel fabrication to the Jamshedpur region
- Active member of Jamshedpur Industrial Association
- Mentors young entrepreneurs in the manufacturing sector

**Vision:** "To be India's most trusted name in automobile body manufacturing, delivering uncompromising quality in every product."

---

## Manufacturing Capabilities

- **CNC Cutting**: Precision plasma and oxy-fuel cutting
- **Hydraulic Press Brake**: Heavy-duty bending up to 12mm steel
- **MIG/TIG Welding**: Certified welders for structural integrity
- **Paint & Finishing**: Industrial paint booth with anti-rust treatment
- **Quality Testing**: Load testing, dimensional checks, weld inspection
- **Assembly & Fitment**: Complete body mounting and hydraulic installation

## Certifications
- ISO 9001:2015 (Quality Management)
- ARAI Compliant (Automotive Research Association of India)
- RTO Approved (Complete documentation support)

---

## Technical Details

### Technology Stack
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript (no framework dependencies)
- **Backend** (production): Node.js + Express REST API with JWT authentication
- **Database** (production): PostgreSQL 16 (Dockerized)
- **Data Storage** (demo): localStorage fallback when API is unavailable
- **Infrastructure**: Docker Compose (PostgreSQL, Node API, Nginx, pgAdmin)
- **Hosting**: Any static hosting for demo; Docker host for production

### Dual-Mode Architecture
The frontend automatically detects whether the backend API is running:
- **API available** (Docker stack running): All data (products, users, orders, favorites, contacts) is stored in PostgreSQL via the REST API.
- **API unavailable** (static hosting / file:// open): Falls back to localStorage for demo/offline usage. No backend required.

This means the same frontend code works in both modes seamlessly.

### Project Structure
```
HimalayaEntp/
├── index.html                → Landing page with full-bleed hero, category tiles, stats,
│                               featured products, gallery strip, process steps, CTA
├── css/styles.css            → All styles, animations, responsive design, dark mode
├── js/
│   ├── app.js                → Navigation, dark mode, toasts, API helper, counters, parallax
│   ├── auth.js               → Auth (API login + localStorage fallback)
│   ├── catalog.js            → Product catalog with images, filtering, stock (API + localStorage)
│   └── cart.js               → Cart, orders, favorites (API + localStorage)
├── pages/
│   ├── catalog.html          → Full product catalog with hero, filters, search, grid/list view
│   ├── about.html            → Company story, CEO profile with photo, capabilities, certs
│   ├── supplier.html         → Supplier dashboard (manage products, stock, orders, analytics)
│   ├── buyer.html            → Buyer dashboard (orders, inquiries, favorites, RFQ)
│   └── contact.html          → Contact form, map, WhatsApp, quick-contact cards
├── assets/
│   ├── tipper.jpg            → 10-Wheeler Tipper Body (hero background)
│   ├── tipper-1.jpg          → 6-Wheeler Tipper Body
│   ├── tip-trailor.jpg       → 12-Wheeler Tipper Body (catalog hero)
│   ├── tip-trailor-2.jpg     → Low-Bed Trailer (contact hero)
│   ├── tip-trailor-34cum.jpg → Hydraulic Tipper Kit (CTA backgrounds)
│   ├── flat-bed-trailor.jpg  → 40ft Flatbed Trailer
│   ├── container-bodies.jpg  → Skeletal Container Trailer / Custom Truck Body
│   ├── tractor-trolley.jpg   → Tractor Trolley Body / Heavy Tractor Chassis
│   ├── 5k-water-tanker.jpg   → 5,000L Water Tank
│   ├── 10K-water-tanker.jpeg → 10,000L Water Tank
│   ├── 20k-water-tanker.jpeg → 20,000L Water Tanker
│   └── rajeev_shukla.jpeg    → CEO Rajeev Shukla photo
├── deployment/
│   ├── SKILL.md              → Docker & database deployment guide
│   ├── docker-compose.yml    → Full stack: postgres, api, nginx, pgadmin
│   ├── .env                  → Environment variables (ports, credentials)
│   ├── api/
│   │   ├── Dockerfile        → Node.js API container
│   │   ├── package.json
│   │   ├── server.js         → Express REST API with JWT auth
│   │   └── db/
│   │       ├── init.sql      → PostgreSQL schema + seed data (14 products, 3 users)
│   │       └── connection.js → Database connection pool
│   └── nginx/
│       └── default.conf      → Reverse proxy config (API proxy, caching rules)
├── skills/
│   └── SKILL.md              → This documentation
└── himalaya_logo.jpeg        → Company logo
```

### Asset Image Mapping

| Image File | Used For |
|------------|----------|
| `tipper.jpg` | 10-Wheeler Tipper product, homepage hero background |
| `tipper-1.jpg` | 6-Wheeler Tipper product, about page hero, category tile |
| `tip-trailor.jpg` | 12-Wheeler Tipper product, catalog page hero |
| `tip-trailor-2.jpg` | Low-Bed Trailer product, contact page hero, category tile |
| `tip-trailor-34cum.jpg` | Hydraulic Tipper Kit product, CTA section backgrounds |
| `flat-bed-trailor.jpg` | 40ft Flatbed Trailer product, category tile, contact CTA |
| `container-bodies.jpg` | Skeletal Container Trailer, Custom Truck Body, category tile |
| `tractor-trolley.jpg` | Tractor Trolley Body, Heavy Tractor Chassis, category tile |
| `5k-water-tanker.jpg` | 5,000L Water Tank product |
| `10K-water-tanker.jpeg` | 10,000L Water Tank product |
| `20k-water-tanker.jpeg` | 20,000L Water Tanker product |
| `rajeev_shukla.jpeg` | CEO profile photo on about page |
| `himalaya_logo.jpeg` | Company logo in navigation |

### Database Tables
When running with Docker, the following PostgreSQL tables store all data:

| Table | Purpose |
|-------|---------|
| `users` | Buyer and supplier accounts (bcrypt-hashed passwords) |
| `categories` | Product categories (tippers, trailers, tractors, water-tanks, custom) |
| `products` | Full product catalog with specs, pricing, stock, images (JSONB) |
| `orders` | Inquiries and RFQs from buyers |
| `order_items` | Individual items within each order |
| `favorites` | User-saved/bookmarked products |
| `contact_inquiries` | Messages from the contact form |
| `audit_log` | Action tracking for key events |

### Nginx Configuration
- API requests (`/api/`) proxied to Node.js backend on port 3000
- Static files served from `/usr/share/nginx/html`
- Image files cached for 7 days (`Cache-Control: public, max-age=604800`)
- JS/CSS files set to no-cache (`no-store, no-cache, must-revalidate`) for development

### Docker Services & Ports

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| Nginx | himalaya-entp-frontend | 8080 | Static files + API proxy |
| Node.js API | himalaya-entp-api | 3001 | REST API with JWT auth |
| PostgreSQL | himalaya-entp-db | 5433 | Primary database |
| pgAdmin | himalaya-entp-pgadmin | 5051 | Database admin UI |

### Running with Docker (Production)
```bash
cd deployment
docker compose up -d --build
# Frontend: http://localhost:8080
# API:      http://localhost:8080/api/health
# pgAdmin:  http://localhost:5051
```

### Running without Docker (Demo)
Simply open `index.html` in a browser. All data persists in localStorage.

### Seed Data Versioning
The frontend uses `SEED_VERSION` (currently v3) in `catalog.js` to manage localStorage product data. When the seed version is bumped, localStorage is cleared and re-seeded with updated product data including image references.

### Customization
To customize the platform:

1. **Company details**: Edit the HTML files directly to change company name, address, phone, email.
2. **Products**: Modify `deployment/api/db/init.sql` (production) or `seedProducts()` in `js/catalog.js` (demo).
3. **Colors**: Update CSS variables in `:root` section of `css/styles.css`.
4. **Users**: Edit `init.sql` (production) or `seedUsers()` in `js/auth.js` (demo).
5. **API endpoints**: Modify `deployment/api/server.js` to add/change business logic.
6. **Images**: Add new images to `assets/` folder and update product records in both `init.sql` and `catalog.js`.

---

## Contact Information

**Himalaya Enterprises**
Industrial Area, Adityapur
Jamshedpur, Jharkhand 831013, India

- **Phone**: +91 93865 94403 (Sales), +91 93865 94403 (Office)
- **Email**: info@himalayaentp.com, sales@himalayaentp.com
- **WhatsApp**: +91 93865 94403
- **Hours**: Monday - Saturday, 9:00 AM - 6:00 PM
