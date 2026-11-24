-- Phase 5: Add payment_reference and optimistic locking version to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
