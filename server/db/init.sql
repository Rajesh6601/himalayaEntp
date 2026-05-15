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
    password    TEXT NOT NULL,
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
    id          VARCHAR(50) PRIMARY KEY,
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
    images      JSONB DEFAULT '[]',
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(specs, '')));

-- ── Orders / Inquiries ──
CREATE TABLE orders (
    id          VARCHAR(30) PRIMARY KEY,
    buyer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('inquiry', 'rfq')),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'quoted', 'negotiating', 'accepted', 'po_issued', 'advance_paid', 'confirmed', 'in-progress', 'invoiced', 'dispatched', 'delivered', 'qc_approved', 'completed', 'cancelled', 'disputed')),
    advance_paid NUMERIC(14, 2) DEFAULT 0,
    balance_paid NUMERIC(14, 2) DEFAULT 0,
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

-- ── Order Messages (Negotiation Thread) ──
CREATE TABLE order_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role     VARCHAR(20) NOT NULL CHECK (sender_role IN ('buyer', 'supplier', 'admin')),
    type            VARCHAR(20) NOT NULL
                    CHECK (type IN ('quote', 'counter_offer', 'comment', 'acceptance', 'rejection', 'advance_payment', 'invoice', 'dispatch', 'grn', 'qc_approved', 'qc_rejected', 'balance_payment', 'dispute_response')),
    quoted_price    NUMERIC(14, 2),
    delivery_estimate VARCHAR(100),
    message         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_messages_order ON order_messages(order_id);

-- ── Invoices ──
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(30) NOT NULL UNIQUE,
    invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,
    supplier_gstin  VARCHAR(20) DEFAULT '10AABCH1234A1ZA',
    buyer_gstin     VARCHAR(20),
    hsn_code        VARCHAR(10) DEFAULT '8707',
    place_of_supply VARCHAR(50) DEFAULT 'Bihar',
    subtotal        NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cgst_rate       NUMERIC(5, 2) DEFAULT 0,
    cgst_amount     NUMERIC(14, 2) DEFAULT 0,
    sgst_rate       NUMERIC(5, 2) DEFAULT 0,
    sgst_amount     NUMERIC(14, 2) DEFAULT 0,
    igst_rate       NUMERIC(5, 2) DEFAULT 0,
    igst_amount     NUMERIC(14, 2) DEFAULT 0,
    total_tax       NUMERIC(14, 2) DEFAULT 0,
    grand_total     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_terms   TEXT,
    notes           TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ── Invoice Items ──
CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     VARCHAR(255) NOT NULL,
    hsn_code        VARCHAR(10) DEFAULT '8707',
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total           NUMERIC(14, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

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

-- ── Audit Log ──
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
('tractors',    'Tractor Trolley',    'Custom tractor body fabrication',              '🚜', 3),
('water-tanks', 'Water Tanks',        'Industrial and commercial water tanks',        '💧', 4),
('custom',      'Custom Fabrication', 'Any automobile body customization on demand',  '🔧', 5),
('container-bodies', 'Container Bodies', 'Container body fabrication & fittings',     '📦', 6);

-- ── Users ──
INSERT INTO users (id, name, email, password, role, phone, company) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Himalaya Admin', 'admin@himalayaentp.com',
    crypt('admin123', gen_salt('bf')), 'supplier', '+91 93865 94403', 'Himalaya Enterprises'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Ramesh Kumar', 'ramesh@example.com',
    crypt('buyer123', gen_salt('bf')), 'buyer', '+91 98765 11111', 'Kumar Transport'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Suresh Traders', 'suresh@example.com',
    crypt('buyer123', gen_salt('bf')), 'buyer', '+91 98765 22222', 'Suresh Traders Pvt Ltd');

-- ── Products ──
INSERT INTO products (name, category_id, specs, description, price_min, price_max, stock, status, icon, images, created_by) VALUES
('10-Wheeler Tipper Body', 'tippers',
    'Capacity: 16 cubic meters | Material: High-tensile steel | Hydraulic lift system',
    'Heavy-duty tipper body designed for mining and construction. Features reinforced floor plates and side walls for maximum durability.',
    285000, 350000, 5, 'available', '🚛', '["tipper.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('6-Wheeler Tipper Body', 'tippers',
    'Capacity: 10 cubic meters | Mild steel construction | Standard hydraulic',
    'Medium-duty tipper body ideal for sand, gravel, and aggregate transport. Lightweight yet sturdy construction.',
    185000, 230000, 8, 'available', '🚛', '["tipper-1.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('12-Wheeler Tipper Body', 'tippers',
    'Capacity: 22 cubic meters | Hardox steel | Heavy hydraulic system',
    'Extra heavy-duty tipper for large-scale mining operations. Built with imported Hardox steel for extreme wear resistance.',
    420000, 520000, 0, 'production', '🚛', '["tip-trailor.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('40ft Flatbed Trailer', 'trailers',
    'Length: 40ft | Payload: 35 tons | Multi-axle suspension',
    'Standard flatbed trailer for general cargo transport. Features robust chassis and reliable suspension system.',
    550000, 700000, 3, 'available', '🚚', '["flat-bed-trailor.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Low-Bed Trailer', 'trailers',
    'Payload: 60 tons | Hydraulic ramps | Detachable gooseneck',
    'Heavy equipment transport trailer with low deck height. Perfect for machinery, excavators, and oversized cargo.',
    850000, 1100000, 1, 'available', '🚚', '["tip-trailor-2.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Skeletal Container Trailer', 'container-bodies',
    '20/40ft container compatible | Twist locks | Lightweight frame',
    'Container chassis trailer designed for intermodal transport. Compatible with standard ISO containers.',
    380000, 480000, 0, 'order', '📦', '["container-bodies.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Tractor Trolley Body', 'tractors',
    'Capacity: 8 tons | Tipping mechanism | Agricultural grade',
    'Agricultural tractor trolley body with hydraulic tipping. Ideal for farm produce, soil, and material transport.',
    120000, 160000, 12, 'available', '🚜', '["tractor-trolley.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Heavy Tractor Chassis', 'tractors',
    'For 50+ HP tractors | Reinforced frame | PTO compatible',
    'Custom tractor chassis body for heavy-duty agricultural and industrial applications.',
    95000, 140000, 6, 'available', '🚜', '["tractor-trolley.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('10,000L Water Tank', 'water-tanks',
    'Capacity: 10,000 liters | SS304 / MS options | Mounted or standalone',
    'Industrial water storage and transport tank. Available in stainless steel or mild steel variants.',
    175000, 250000, 4, 'available', '💧', '["10K-water-tanker.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('20,000L Water Tanker', 'water-tanks',
    'Capacity: 20,000 liters | Vehicle-mounted | Spray system included',
    'Large capacity vehicle-mounted water tanker with integrated spray system for municipal and industrial use.',
    320000, 420000, 2, 'available', '💧', '["20k-water-tanker.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('5,000L Water Tank', 'water-tanks',
    'Capacity: 5,000 liters | Compact design | Quick-mount system',
    'Compact water tank suitable for smaller vehicles and localized water supply needs.',
    95000, 130000, 0, 'production', '💧', '["5k-water-tanker.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Custom Truck Body', 'container-bodies',
    'Built to specification | Any vehicle type | Design consultation',
    'Fully customized truck body fabrication based on your exact requirements. Includes design consultation and engineering.',
    200000, 800000, 0, 'order', '📦', '["container-bodies.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Crane Body Fabrication', 'custom',
    'Crane mounting platform | Outrigger supports | Structural certification',
    'Specialized crane body and mounting platform fabrication with structural engineering certification.',
    450000, 900000, 0, 'order', '🔧', '[]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Hydraulic Tipper Kit', 'custom',
    'Retrofit kit | 15-ton capacity | Complete hydraulic system',
    'Complete hydraulic tipper conversion kit for existing truck bodies. Easy installation with full support.',
    85000, 120000, 7, 'available', '🔧', '["tip-trailor-34cum.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
