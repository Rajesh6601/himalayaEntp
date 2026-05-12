-- ============================================================
-- Migration 001: RFQ Negotiation Workflow
-- Safe to run multiple times on existing databases
-- ============================================================

-- 1. Expand orders.status constraint to include negotiation statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'quoted', 'negotiating', 'accepted', 'po_issued', 'confirmed', 'in-progress', 'completed', 'cancelled'));

-- 2. Create order_messages table for negotiation thread
CREATE TABLE IF NOT EXISTS order_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role     VARCHAR(20) NOT NULL CHECK (sender_role IN ('buyer', 'supplier', 'admin')),
    type            VARCHAR(20) NOT NULL
                    CHECK (type IN ('quote', 'counter_offer', 'comment', 'acceptance', 'rejection')),
    quoted_price    NUMERIC(14, 2),
    delivery_estimate VARCHAR(100),
    message         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id);
