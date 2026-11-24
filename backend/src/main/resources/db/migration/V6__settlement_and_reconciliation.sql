-- Phase 8: Settlement Batches and Records
CREATE TABLE IF NOT EXISTS settlement_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_reference VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_records INTEGER NOT NULL DEFAULT 0,
    matched_records INTEGER NOT NULL DEFAULT 0,
    mismatched_records INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'IMPORTED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_batch_reference UNIQUE (batch_reference)
);

CREATE INDEX IF NOT EXISTS idx_batch_ref ON settlement_batches(batch_reference);
CREATE INDEX IF NOT EXISTS idx_batch_status ON settlement_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_created ON settlement_batches(created_at);

CREATE TABLE IF NOT EXISTS settlement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL,
    transaction_reference VARCHAR(120) NOT NULL,
    payment_reference VARCHAR(120),
    amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    settlement_status VARCHAR(60),
    settlement_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_settle_batch FOREIGN KEY (batch_id) REFERENCES settlement_batches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_settle_batch_id ON settlement_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_settle_tx_ref ON settlement_records(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_settle_pay_ref ON settlement_records(payment_reference);

-- Extend reconciliation_records with batch_id, internal_reference and currency
ALTER TABLE reconciliation_records ADD COLUMN IF NOT EXISTS batch_id UUID;
ALTER TABLE reconciliation_records ADD COLUMN IF NOT EXISTS internal_reference VARCHAR(120);
ALTER TABLE reconciliation_records ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

CREATE INDEX IF NOT EXISTS idx_recon_batch_id ON reconciliation_records(batch_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_recon_batch'
    ) THEN
        ALTER TABLE reconciliation_records 
        ADD CONSTRAINT fk_recon_batch 
        FOREIGN KEY (batch_id) REFERENCES settlement_batches(id) ON DELETE SET NULL;
    END IF;
END $$;
