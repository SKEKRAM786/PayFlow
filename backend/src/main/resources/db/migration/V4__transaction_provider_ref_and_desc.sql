-- Phase 6: Add provider_reference and description to payment_transactions
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider_reference VARCHAR(120);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS description VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_tx_provider_ref ON payment_transactions(provider_reference);
