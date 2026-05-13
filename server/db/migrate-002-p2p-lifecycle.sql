-- ============================================================
-- Migration 002: B2B Procure-to-Pay Lifecycle
-- Adds: invoice tables, payment columns, expanded status/type constraints
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Expand orders.status constraint to include P2P lifecycle statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'pending', 'quoted', 'negotiating', 'accepted',
        'po_issued', 'advance_paid', 'confirmed', 'in-progress',
        'invoiced', 'dispatched', 'delivered', 'qc_approved',
        'completed', 'cancelled', 'disputed'
    ));

-- 2. Add payment tracking columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_paid NUMERIC(14, 2) DEFAULT 0;

-- 3. Expand order_messages.type constraint to include P2P message types
ALTER TABLE order_messages DROP CONSTRAINT IF EXISTS order_messages_type_check;
ALTER TABLE order_messages ADD CONSTRAINT order_messages_type_check
    CHECK (type IN (
        'quote', 'counter_offer', 'comment', 'acceptance', 'rejection',
        'advance_payment', 'invoice', 'dispatch', 'grn',
        'qc_approved', 'qc_rejected', 'balance_payment', 'dispute_response'
    ));

-- 4. Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
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

CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- 5. Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     VARCHAR(255) NOT NULL,
    hsn_code        VARCHAR(10) DEFAULT '8707',
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total           NUMERIC(14, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
