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
('tippers',           'Tippers',            'Heavy-duty tipper bodies for trucks',                        '🚛', 1),
('trailers',          'Trailers',           'Flatbed, low-bed, skeletal trailers',                        '🚚', 2),
('tractors',          'Tracter Trolleys',   'Custom tracter trolley body fabrication',                    '🚜', 3),
('water-tanks',       'Water Tanker',       'Industrial and commercial water tankers',                    '💧', 4),
('load-body',         'Load Body',          'Load bodies for goods transport trucks',                     '📐', 5),
('containers',        'Containers',         'Container fabrication & fittings',                           '📦', 6),
('waste-management',  'Waste Management Solutions', 'Garbage compactors, hook loaders & waste equipment', '♻️', 7),
('custom',            'All kinds of Automobile Body Building work', 'Any automobile body customization on demand', '🔧', 8);

-- ── Users ──
INSERT INTO users (id, name, email, password, role, phone, company) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Himalaya Admin', 'admin@himalayaentp.com',
    crypt('admin123', gen_salt('bf')), 'supplier', '+91 93863 91266', 'Himalaya Enterprises'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Ramesh Kumar', 'ramesh@example.com',
    crypt('buyer123', gen_salt('bf')), 'buyer', '+91 98765 11111', 'Kumar Transport'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Suresh Traders', 'suresh@example.com',
    crypt('buyer123', gen_salt('bf')), 'buyer', '+91 98765 22222', 'Suresh Traders Pvt Ltd');

-- ── Products ──
INSERT INTO products (name, category_id, specs, description, price_min, price_max, stock, status, icon, images, created_by) VALUES
-- Tippers
('24 Cum Tipper Body', 'tippers', 'Capacity: 24 cubic meters | High-tensile steel | Heavy hydraulic system', 'Heavy-duty 24 cubic meter tipper body for large-scale mining and construction operations.', 380000, 480000, 3, 'available', '🚛', '["tipper-24cum.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('20 Cum Tipper Body (BharatBenz 3118)', 'tippers', 'Capacity: 20 cubic meters | BharatBenz 3118 compatible | Reinforced floor', '20 cubic meter tipper body designed for BharatBenz 3118 chassis. Heavy-duty construction for mining and infrastructure.', 340000, 420000, 4, 'available', '🚛', '["tipper-20cum-3118.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('20 Cum Tipper Body', 'tippers', 'Capacity: 20 cubic meters | Hardox steel | Standard hydraulic', '20 cubic meter tipper body built with high-tensile steel for aggregate and material transport.', 320000, 400000, 5, 'available', '🚛', '["tipper-20cum.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('16 Cum Tipper Body', 'tippers', 'Capacity: 16 cubic meters | High-tensile steel | Hydraulic lift system', 'Heavy-duty 16 cubic meter tipper body designed for mining and construction. Reinforced floor plates and side walls.', 285000, 350000, 5, 'available', '🚛', '["tipper-16cum-01.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('16 Cum Tipper Body (Creative)', 'tippers', 'Capacity: 16 cubic meters | Creative design | Premium finish', '16 cubic meter tipper with creative body design. Premium finish with enhanced durability.', 295000, 365000, 3, 'available', '🚛', '["tipper-16cum-02.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('14 Cum Tipper Body', 'tippers', 'Capacity: 14 cubic meters | Mild steel construction | Standard hydraulic', '14 cubic meter tipper body ideal for medium-duty sand, gravel, and aggregate transport.', 245000, 310000, 6, 'available', '🚛', '["tipper-14cum.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('8.5 Cum Tipper SK1613', 'tippers', 'Capacity: 8.5 cubic meters | Tata SK1613 compatible | Compact design', '8.5 cubic meter tipper body for Tata SK1613 chassis. Compact yet robust for urban and semi-urban operations.', 185000, 230000, 8, 'available', '🚛', '["tipper-8.5cum-sk1613.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Tata Ace Tipper', 'tippers', 'Tata Ace compatible | Light-duty | Hydraulic tipping', 'Light-duty tipper body for Tata Ace mini trucks. Perfect for small-scale construction and material transport.', 75000, 110000, 10, 'available', '🚛', '["tata-ace-tipper.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Tipper Components Set 1', 'tippers', 'Floor plates | Side panels | Tail gate | Mounting brackets', 'Complete tipper component set including floor plates, side panels, tail gate, and mounting brackets.', 45000, 85000, 15, 'available', '🚛', '["tipper-components-01.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Tipper Components Set 2', 'tippers', 'Hydraulic cylinders | Hinge assembly | Locking mechanism', 'Tipper hydraulic and mechanical component set including cylinders, hinge assemblies, and locking mechanisms.', 55000, 95000, 12, 'available', '🚛', '["tipper-components-02.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- Trailers
('Trailer Side Wall 32 FT', 'trailers', 'Length: 32ft | Side wall type | Multi-axle suspension', '32 feet side wall trailer for bulk cargo transport. Robust construction with multi-axle suspension system.', 500000, 650000, 2, 'available', '🚚', '["trailer-sidewall-32ft.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Tip Trailer 28 Cum', 'trailers', 'Capacity: 28 cubic meters | Hydraulic tipping | Heavy-duty chassis', '28 cubic meter tip trailer with hydraulic tipping mechanism. Heavy-duty chassis for mining and large-scale transport.', 750000, 950000, 1, 'available', '🚚', '["tip-trailer-28cum.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('40ft Flatbed Trailer', 'trailers', 'Length: 40ft | Payload: 35 tons | Multi-axle suspension', 'Standard flatbed trailer for general cargo transport. Robust chassis and reliable suspension system.', 550000, 700000, 3, 'available', '🚚', '["flat-bed-trailor.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- Tracter Trolleys
('Tracter Trolley Type 1', 'tractors', 'Capacity: 8 tons | Tipping mechanism | Agricultural grade', 'Agricultural tracter trolley body with hydraulic tipping. Ideal for farm produce, soil, and material transport.', 120000, 160000, 12, 'available', '🚜', '["tracter-trolley-01.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Tracter Trolley Type 2', 'tractors', 'Heavy-duty | Reinforced frame | Higher payload', 'Heavy-duty tracter trolley with reinforced frame for higher payload capacity. Suitable for industrial and agricultural use.', 140000, 185000, 8, 'available', '🚜', '["tracter-trolley-02.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Tracter Trolley Type 3', 'tractors', 'Extended body | Multi-purpose | Tipping capable', 'Extended body tracter trolley for versatile applications. Multi-purpose design with tipping capability.', 155000, 200000, 5, 'available', '🚜', '["tracter-trolley-03.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Tractor Adjustable Hitch', 'tractors', 'Universal fit | Adjustable height | Heavy-duty steel', 'Universal adjustable hitch for tractor trolley connection. Heavy-duty steel construction with adjustable height mechanism.', 25000, 45000, 20, 'available', '🚜', '["tractor-adjustable-hitch.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- Water Tanker
('10,000L Water Tanker', 'water-tanks', 'Capacity: 10,000 liters | SS304 / MS options | Mounted or standalone', 'Industrial water storage and transport tanker. Available in stainless steel or mild steel variants.', 175000, 250000, 4, 'available', '💧', '["10K-water-tanker.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('20,000L Water Tanker', 'water-tanks', 'Capacity: 20,000 liters | Vehicle-mounted | Spray system included', 'Large capacity vehicle-mounted water tanker with integrated spray system for municipal and industrial use.', 320000, 420000, 2, 'available', '💧', '["20k-water-tanker.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('5,000L Water Tanker', 'water-tanks', 'Capacity: 5,000 liters | Compact design | Quick-mount system', 'Compact water tanker suitable for smaller vehicles and localized water supply needs.', 95000, 130000, 0, 'production', '💧', '["5k-water-tanker.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- Load Body
('Tata 720 Load Body', 'load-body', 'Tata 720 compatible | MS construction | Side-open design', 'Load body designed for Tata 720 trucks. Mild steel construction with side-open configuration for easy loading/unloading.', 150000, 210000, 5, 'available', '📐', '["tata-720-load-body.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Eicher Load Body', 'load-body', 'Eicher compatible | Heavy-duty | High side walls', 'Heavy-duty load body for Eicher trucks. High side walls for bulk cargo with durable steel construction.', 165000, 230000, 4, 'available', '📐', '["eicher-load-body.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- Containers
('Container Body', 'containers', 'Standard ISO compatible | Weather-proof | Lockable doors', 'Standard container body fabrication with weather-proof construction and secure lockable doors for cargo transport.', 350000, 480000, 2, 'available', '📦', '["container.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Skeletal Container Trailer', 'containers', '20/40ft container compatible | Twist locks | Lightweight frame', 'Container chassis trailer designed for intermodal transport. Compatible with standard ISO containers.', 380000, 480000, 0, 'order', '📦', '["container-bodies.jpg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- Waste Management Solutions
('Garbage Tipper', 'waste-management', 'Municipal grade | Hydraulic tipping | Covered design', 'Municipal grade garbage tipper with hydraulic tipping mechanism. Covered design for hygienic waste collection and transport.', 450000, 650000, 2, 'available', '♻️', '["garbage-tipper.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Prefabricated Modular Toilet', 'waste-management', 'Prefabricated | Modular design | Easy installation', 'Prefabricated modular toilet unit for municipal and construction site deployment. Easy installation and relocation.', 180000, 300000, 0, 'order', '♻️', '["prefab-modular-toilet.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- All kinds of Automobile Body Building work
('Concrete Mixer Body', 'custom', 'Drum type | Vehicle-mounted | Heavy-duty rotation system', 'Vehicle-mounted concrete mixer body with heavy-duty drum and rotation system for construction applications.', 550000, 800000, 0, 'order', '🔧', '["concrete-mixer.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Food Van Body', 'custom', 'Food-grade interior | Insulated | Custom layout', 'Custom food van body with food-grade interior, insulated walls, and customizable layout for mobile food business.', 350000, 550000, 0, 'order', '🔧', '["food-van.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Custom Automobile Body Building', 'custom', 'Built to specification | Any vehicle type | Design consultation', 'All kinds of automobile body building, repairing and fabrication work. Fully customized to your exact requirements.', 200000, 800000, 0, 'order', '🔧', '["automobile-bodybuilding-01.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Special Purpose Vehicle Body', 'custom', 'Custom design | Any application | Engineering consultation', 'Special purpose vehicle body fabrication for unique applications. Includes complete design and engineering consultation.', 300000, 1000000, 0, 'order', '🔧', '["automobile-bodybuilding-02.jpeg"]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
