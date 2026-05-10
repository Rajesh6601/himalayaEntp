# Himalaya Enterprises - Deployment & Database Guide

This guide covers how to deploy the Himalaya Enterprises platform with a persistent database backend using Docker, replacing the localStorage demo layer with a production-ready PostgreSQL + Node.js API stack.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Docker Host                          │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │  nginx    │   │   node-api   │   │  postgresql  │     │
│  │ (frontend)│──▶│  (backend)   │──▶│  (database)  │     │
│  │  :8080    │   │  :3001       │   │  :5433       │     │
│  └──────────┘   └──────────────┘   └──────────────┘     │
│                                                          │
│  ┌──────────────┐                                        │
│  │   pgadmin     │  (optional - DB management UI)        │
│  │   :5051       │                                       │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

| Service    | Role                                        | Port | Container Name |
|------------|---------------------------------------------|------|----------------|
| nginx      | Serves static frontend (HTML/CSS/JS)        | 8080 | himalaya-entp-frontend |
| node-api   | REST API for products, orders, users, auth  | 3001 | himalaya-entp-api |
| postgresql | Persistent relational database               | 5433 | himalaya-entp-db |
| pgadmin    | (Optional) Web-based database admin panel   | 5051 | himalaya-entp-pgadmin |

> **Note:** Ports are configurable via `.env`. Default ports are offset to avoid conflicts with other services.

### Docker Images Used

| Service    | Image                    | Architecture |
|------------|--------------------------|-------------|
| PostgreSQL | `postgres:16-alpine`     | multi-arch  |
| Node API   | `node:20-alpine` (built) | multi-arch  |
| Nginx      | `nginx:latest`           | linux/arm64 (auto-detected) |
| pgAdmin    | `dpage/pgadmin4:latest`  | multi-arch  |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- Git (to clone the project)

Verify installation:

```bash
docker --version
docker compose version
```

---

## Step 1: Project Structure for Deployment

Create the following files inside the project root:

```
HimalayaEntp/
├── deployment/
│   ├── SKILL.md              ← This file
│   ├── docker-compose.yml
│   ├── .env
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── server.js
│   │   └── db/
│   │       ├── init.sql       ← Schema + seed data
│   │       └── connection.js
│   └── nginx/
│       └── default.conf
├── index.html
├── css/
├── js/
├── pages/
└── ...
```

---

## Step 2: Environment Variables

Create `deployment/.env`:

```env
# PostgreSQL
POSTGRES_USER=himalaya_admin
POSTGRES_PASSWORD=H1m@l4y4_Entp_2024
POSTGRES_DB=himalaya_db
POSTGRES_PORT=5432

# Node API
API_PORT=3000
JWT_SECRET=himalaya-jwt-secret-change-in-production

# pgAdmin (optional)
PGADMIN_EMAIL=admin@himalayaentp.com
PGADMIN_PASSWORD=pgadmin123
```

> **Important:** Change all passwords and the JWT_SECRET before deploying to production.

---

## Step 3: Docker Compose

Create `deployment/docker-compose.yml`:

```yaml
version: "3.8"

services:
  # ── PostgreSQL Database ──
  postgres:
    image: postgres:16-alpine
    container_name: himalaya-db
    restart: unless-stopped
    env_file: .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./api/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - himalaya-net

  # ── Node.js REST API ──
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: himalaya-api
    restart: unless-stopped
    env_file: .env
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      PORT: ${API_PORT:-3000}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - himalaya-net

  # ── Nginx Frontend ──
  nginx:
    image: nginx:alpine
    container_name: himalaya-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ../index.html:/usr/share/nginx/html/index.html:ro
      - ../css:/usr/share/nginx/html/css:ro
      - ../js:/usr/share/nginx/html/js:ro
      - ../pages:/usr/share/nginx/html/pages:ro
      - ../assets:/usr/share/nginx/html/assets:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api
    networks:
      - himalaya-net

  # ── pgAdmin (Optional) ──
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: himalaya-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - himalaya-net

volumes:
  pgdata:
    driver: local

networks:
  himalaya-net:
    driver: bridge
```

---

## Step 4: Database Schema (init.sql)

Create `deployment/api/db/init.sql`:

```sql
-- ============================================================
-- Himalaya Enterprises - Database Schema
-- PostgreSQL 16
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ──
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    TEXT NOT NULL,  -- bcrypt hash
    role        VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'supplier', 'admin')),
    phone       VARCHAR(20),
    company     VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ── Product Categories ──
CREATE TABLE categories (
    id          VARCHAR(50) PRIMARY KEY,  -- e.g. 'tippers', 'trailers'
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(10),
    sort_order  INTEGER DEFAULT 0
);

-- ── Products ──
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    specs       TEXT,
    description TEXT,
    price_min   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_max   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock       INTEGER NOT NULL DEFAULT 0,
    status      VARCHAR(20) NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'production', 'order')),
    icon        VARCHAR(10) DEFAULT '📦',
    images      JSONB DEFAULT '[]',       -- array of image URLs
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(specs, '')));

-- ── Orders / Inquiries ──
CREATE TABLE orders (
    id          VARCHAR(30) PRIMARY KEY,  -- e.g. 'ORD-XXXXXX' or 'RFQ-XXXXXX'
    buyer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('inquiry', 'rfq')),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')),
    notes       TEXT,
    total_value NUMERIC(14, 2) DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ── Order Items ──
CREATE TABLE order_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    VARCHAR(30) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(50),
    specs       TEXT,
    quantity    INTEGER NOT NULL DEFAULT 1,
    price       NUMERIC(12, 2) DEFAULT 0,
    price_max   NUMERIC(12, 2) DEFAULT 0
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ── Favorites ──
CREATE TABLE favorites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ── Contact Inquiries ──
CREATE TABLE contact_inquiries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    product_interest VARCHAR(50),
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit Log (optional - tracks key actions) ──
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   VARCHAR(100),
    details     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);

-- ── Updated-at trigger ──
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- ============================================================
-- SEED DATA
-- ============================================================

-- ── Categories ──
INSERT INTO categories (id, name, description, icon, sort_order) VALUES
('tippers',     'Tippers',            'Heavy-duty tipper bodies for trucks',          '🚛', 1),
('trailers',    'Trailers',           'Flatbed, low-bed, skeletal trailers',          '🚚', 2),
('tractors',    'Tractor Bodies',     'Custom tractor body fabrication',              '🚜', 3),
('water-tanks', 'Water Tanks',        'Industrial and commercial water tanks',        '💧', 4),
('custom',      'Custom Fabrication', 'Any automobile body customization on demand',  '🔧', 5);

-- ── Users (passwords are bcrypt hashes) ──
-- admin123 => $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36iG0dMLmcwCGkPaXIiB6mG
-- buyer123 => $2b$10$pK1lFMzBiBBrZ3/I5yROxOyKZ3GE3sFjG6J7qRp5YZWJ7y2P3E0x6
INSERT INTO users (id, name, email, password, role, phone, company) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Himalaya Admin', 'admin@himalayaentp.com',
    crypt('admin123', gen_salt('bf')), 'supplier', '+91 98765 43210', 'Himalaya Enterprises'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Ramesh Kumar', 'ramesh@example.com',
    crypt('buyer123', gen_salt('bf')), 'buyer', '+91 98765 11111', 'Kumar Transport'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Suresh Traders', 'suresh@example.com',
    crypt('buyer123', gen_salt('bf')), 'buyer', '+91 98765 22222', 'Suresh Traders Pvt Ltd');

-- ── Products ──
INSERT INTO products (name, category_id, specs, description, price_min, price_max, stock, status, icon, created_by) VALUES
('10-Wheeler Tipper Body', 'tippers',
    'Capacity: 16 cubic meters | Material: High-tensile steel | Hydraulic lift system',
    'Heavy-duty tipper body designed for mining and construction. Features reinforced floor plates and side walls for maximum durability.',
    285000, 350000, 5, 'available', '🚛', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('6-Wheeler Tipper Body', 'tippers',
    'Capacity: 10 cubic meters | Mild steel construction | Standard hydraulic',
    'Medium-duty tipper body ideal for sand, gravel, and aggregate transport. Lightweight yet sturdy construction.',
    185000, 230000, 8, 'available', '🚛', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('12-Wheeler Tipper Body', 'tippers',
    'Capacity: 22 cubic meters | Hardox steel | Heavy hydraulic system',
    'Extra heavy-duty tipper for large-scale mining operations. Built with imported Hardox steel for extreme wear resistance.',
    420000, 520000, 0, 'production', '🚛', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('40ft Flatbed Trailer', 'trailers',
    'Length: 40ft | Payload: 35 tons | Multi-axle suspension',
    'Standard flatbed trailer for general cargo transport. Features robust chassis and reliable suspension system.',
    550000, 700000, 3, 'available', '🚚', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Low-Bed Trailer', 'trailers',
    'Payload: 60 tons | Hydraulic ramps | Detachable gooseneck',
    'Heavy equipment transport trailer with low deck height. Perfect for machinery, excavators, and oversized cargo.',
    850000, 1100000, 1, 'available', '🚚', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Skeletal Container Trailer', 'trailers',
    '20/40ft container compatible | Twist locks | Lightweight frame',
    'Container chassis trailer designed for intermodal transport. Compatible with standard ISO containers.',
    380000, 480000, 0, 'order', '🚚', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Tractor Trolley Body', 'tractors',
    'Capacity: 8 tons | Tipping mechanism | Agricultural grade',
    'Agricultural tractor trolley body with hydraulic tipping. Ideal for farm produce, soil, and material transport.',
    120000, 160000, 12, 'available', '🚜', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Heavy Tractor Chassis', 'tractors',
    'For 50+ HP tractors | Reinforced frame | PTO compatible',
    'Custom tractor chassis body for heavy-duty agricultural and industrial applications.',
    95000, 140000, 6, 'available', '🚜', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('10,000L Water Tank', 'water-tanks',
    'Capacity: 10,000 liters | SS304 / MS options | Mounted or standalone',
    'Industrial water storage and transport tank. Available in stainless steel or mild steel variants.',
    175000, 250000, 4, 'available', '💧', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('20,000L Water Tanker', 'water-tanks',
    'Capacity: 20,000 liters | Vehicle-mounted | Spray system included',
    'Large capacity vehicle-mounted water tanker with integrated spray system for municipal and industrial use.',
    320000, 420000, 2, 'available', '💧', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('5,000L Water Tank', 'water-tanks',
    'Capacity: 5,000 liters | Compact design | Quick-mount system',
    'Compact water tank suitable for smaller vehicles and localized water supply needs.',
    95000, 130000, 0, 'production', '💧', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Custom Truck Body', 'custom',
    'Built to specification | Any vehicle type | Design consultation',
    'Fully customized truck body fabrication based on your exact requirements. Includes design consultation and engineering.',
    200000, 800000, 0, 'order', '🔧', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Crane Body Fabrication', 'custom',
    'Crane mounting platform | Outrigger supports | Structural certification',
    'Specialized crane body and mounting platform fabrication with structural engineering certification.',
    450000, 900000, 0, 'order', '🔧', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Hydraulic Tipper Kit', 'custom',
    'Retrofit kit | 15-ton capacity | Complete hydraulic system',
    'Complete hydraulic tipper conversion kit for existing truck bodies. Easy installation with full support.',
    85000, 120000, 7, 'available', '🔧', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- ============================================================
-- Verify
-- ============================================================
-- SELECT count(*) FROM users;       -- 3
-- SELECT count(*) FROM products;    -- 14
-- SELECT count(*) FROM categories;  -- 5
```

---

## Step 5: Node.js API Server

### `deployment/api/package.json`

```json
{
  "name": "himalaya-api",
  "version": "1.0.0",
  "description": "REST API for Himalaya Enterprises platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.12.0"
  }
}
```

### `deployment/api/db/connection.js`

```js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

### `deployment/api/server.js`

```js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

app.use(cors());
app.use(express.json());

// ── Auth Middleware ──
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ── Health Check ──
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ══════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hash, role || 'buyer']
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// PRODUCT ROUTES
// ══════════════════════════════════════════════

app.get('/api/products', async (req, res) => {
  const { category, search, status } = req.query;
  let sql = 'SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];
  let idx = 1;

  if (category && category !== 'all') {
    sql += ` AND p.category_id = $${idx++}`;
    params.push(category);
  }
  if (status && status !== 'all') {
    sql += ` AND p.status = $${idx++}`;
    params.push(status);
  }
  if (search) {
    sql += ` AND (p.name ILIKE $${idx} OR p.specs ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  sql += ' ORDER BY p.created_at DESC';

  try {
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticate, requireRole('supplier'), async (req, res) => {
  const { name, category_id, specs, description, price_min, price_max, stock, status, icon } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO products (name, category_id, specs, description, price_min, price_max, stock, status, icon, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, category_id, specs, description, price_min, price_max, stock || 0, status || 'available', icon || '📦', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticate, requireRole('supplier'), async (req, res) => {
  const { name, category_id, specs, description, price_min, price_max, stock, status, icon } = req.body;
  try {
    const result = await db.query(
      `UPDATE products SET name=$1, category_id=$2, specs=$3, description=$4, price_min=$5, price_max=$6,
       stock=$7, status=$8, icon=$9 WHERE id=$10 RETURNING *`,
      [name, category_id, specs, description, price_min, price_max, stock, status, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id/stock', authenticate, requireRole('supplier'), async (req, res) => {
  const { stock } = req.body;
  const status = stock > 0 ? 'available' : 'order';
  try {
    const result = await db.query(
      'UPDATE products SET stock=$1, status=$2 WHERE id=$3 RETURNING *',
      [stock, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// ORDER ROUTES
// ══════════════════════════════════════════════

app.get('/api/orders', authenticate, async (req, res) => {
  try {
    let sql, params;
    if (req.user.role === 'supplier') {
      sql = `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
             FROM orders o JOIN users u ON o.buyer_id = u.id ORDER BY o.created_at DESC`;
      params = [];
    } else {
      sql = `SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC`;
      params = [req.user.id];
    }
    const result = await db.query(sql, params);

    // Fetch items for each order
    for (const order of result.rows) {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      order.items = items.rows;
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  const { type, items, notes } = req.body;
  const prefix = type === 'rfq' ? 'RFQ-' : 'ORD-';
  const orderId = prefix + Date.now().toString(36).toUpperCase();

  try {
    await db.query('BEGIN');
    await db.query(
      'INSERT INTO orders (id, buyer_id, type, notes) VALUES ($1, $2, $3, $4)',
      [orderId, req.user.id, type, notes || '']
    );
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, name, category, specs, quantity, price, price_max)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, item.product_id || null, item.name, item.category || null, item.specs || null,
         item.quantity || 1, item.price || 0, item.price_max || 0]
      );
    }
    await db.query('COMMIT');
    res.status(201).json({ id: orderId, status: 'pending' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', authenticate, requireRole('supplier'), async (req, res) => {
  const { status } = req.body;
  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// FAVORITES
// ══════════════════════════════════════════════

app.get('/api/favorites', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.* FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/favorites/:productId', authenticate, async (req, res) => {
  try {
    await db.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/favorites/:productId', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// CONTACT INQUIRIES
// ══════════════════════════════════════════════

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, product_interest, message } = req.body;
  try {
    await db.query(
      'INSERT INTO contact_inquiries (name, email, phone, product_interest, message) VALUES ($1,$2,$3,$4,$5)',
      [name, email, phone, product_interest, message]
    );
    res.status(201).json({ message: 'Inquiry submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════

app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`Himalaya API running on port ${PORT}`);
});
```

### `deployment/api/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## Step 6: Nginx Configuration

Create `deployment/nginx/default.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Step 7: Launch the Stack

```bash
cd /path/to/HimalayaEntp/deployment

# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f

# View API logs only
docker compose logs -f api
```

### Verify the stack is running:

| Check | URL/Command |
|-------|-------------|
| Frontend | http://localhost:8080 |
| API health | http://localhost:8080/api/health |
| API products | http://localhost:8080/api/products |
| pgAdmin | http://localhost:5051 |
| DB direct | `docker exec -it himalaya-entp-db psql -U himalaya_admin -d himalaya_db` |

---

## Step 8: Connect pgAdmin to the Database

1. Open http://localhost:5051
2. Login with credentials from `.env` (`admin@himalayaentp.com` / `pgadmin123`)
3. Add New Server:
   - **Name:** Himalaya DB
   - **Host:** `postgres` (Docker service name, not localhost)
   - **Port:** `5432` (internal Docker port)
   - **Username:** `himalaya_admin`
   - **Password:** `H1m@l4y4_Entp_2024`
4. Browse tables under: Himalaya DB > Databases > himalaya_db > Schemas > public > Tables

---

## Common Docker Commands

```bash
# Stop all services
docker compose down

# Stop and remove all data (including database!)
docker compose down -v

# Rebuild API after code changes
docker compose up -d --build api

# Connect to database shell
docker exec -it himalaya-entp-db psql -U himalaya_admin -d himalaya_db

# Useful SQL queries inside psql:
#   \dt                        -- list all tables
#   SELECT * FROM users;       -- list users
#   SELECT * FROM products;    -- list products
#   SELECT * FROM orders;      -- list orders

# Backup database
docker exec himalaya-entp-db pg_dump -U himalaya_admin himalaya_db > backup.sql

# Restore database
docker exec -i himalaya-entp-db psql -U himalaya_admin -d himalaya_db < backup.sql

# View container resource usage
docker stats
```

---

## API Reference

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT token |
| POST | `/api/auth/register` | `{ name, email, password, role }` | Register new user |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | No | List products (query: `category`, `search`, `status`) |
| GET | `/api/products/:id` | No | Get single product |
| POST | `/api/products` | Supplier | Create product |
| PUT | `/api/products/:id` | Supplier | Update product |
| PATCH | `/api/products/:id/stock` | Supplier | Update stock `{ stock }` |
| DELETE | `/api/products/:id` | Supplier | Delete product |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | Yes | List orders (supplier sees all, buyer sees own) |
| POST | `/api/orders` | Buyer | Create order `{ type, items[], notes }` |
| PATCH | `/api/orders/:id/status` | Supplier | Update status `{ status }` |

### Favorites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/favorites` | Yes | List user's favorites |
| POST | `/api/favorites/:productId` | Yes | Add to favorites |
| DELETE | `/api/favorites/:productId` | Yes | Remove from favorites |

### Other

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/contact` | No | Submit contact form |
| GET | `/api/categories` | No | List product categories |
| GET | `/api/health` | No | Health check |

All authenticated endpoints require header: `Authorization: Bearer <token>`

---

## Production Checklist

- [ ] Change all passwords in `.env`
- [ ] Generate a strong random `JWT_SECRET`
- [ ] Enable HTTPS (use a reverse proxy like Traefik or Caddy, or add SSL to nginx)
- [ ] Set `POSTGRES_PORT` to a non-default port or remove the external port mapping
- [ ] Remove pgAdmin service or restrict access in production
- [ ] Add rate limiting to the API (e.g., `express-rate-limit`)
- [ ] Set up automated database backups
- [ ] Configure log rotation for Docker containers
- [ ] Add monitoring (e.g., Prometheus + Grafana or a cloud monitoring service)
- [ ] Set proper CORS origins in the API instead of `cors()` (allow-all)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `port 5433 already in use` | Change `POSTGRES_PORT` in `.env` or stop conflicting service |
| `port 8080 already in use` | Change `NGINX_PORT` in `.env` |
| API can't connect to DB | Ensure `postgres` service is healthy: `docker compose ps` |
| init.sql not running | Only runs on first launch. To re-run: `docker compose down -v && docker compose up -d` |
| pgAdmin can't connect | Use `postgres` as hostname (not `localhost`) inside Docker network |
