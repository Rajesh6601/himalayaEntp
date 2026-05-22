-- Migration 002: Payment Tracking System
-- Adds supplier payment confirmation, dispute flow, and partial payment accumulation

-- Add confirmation columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_confirmed BOOLEAN DEFAULT FALSE;

-- Update orders status CHECK constraint to include payment_disputed
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'quoted', 'negotiating', 'accepted', 'po_issued', 'advance_paid', 'confirmed', 'in-progress', 'invoiced', 'dispatched', 'delivered', 'qc_approved', 'completed', 'cancelled', 'disputed', 'payment_disputed'));

-- Update order_messages type CHECK constraint to include payment confirmation types
ALTER TABLE order_messages DROP CONSTRAINT IF EXISTS order_messages_type_check;
ALTER TABLE order_messages ALTER COLUMN type TYPE VARCHAR(30);
ALTER TABLE order_messages ADD CONSTRAINT order_messages_type_check
  CHECK (type IN ('quote', 'counter_offer', 'comment', 'acceptance', 'rejection', 'advance_payment', 'invoice', 'dispatch', 'grn', 'qc_approved', 'qc_rejected', 'balance_payment', 'dispute_response', 'advance_payment_confirmed', 'advance_payment_disputed', 'balance_payment_confirmed', 'balance_payment_disputed'));
