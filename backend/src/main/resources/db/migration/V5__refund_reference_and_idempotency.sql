-- Phase 7: Add refund_reference and idempotency_key to refunds table
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(64);
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_reference ON refunds(refund_reference);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_idempotency ON refunds(idempotency_key);
