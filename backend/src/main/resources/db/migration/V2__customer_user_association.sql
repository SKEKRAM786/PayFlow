-- Add user_id column to customers to link customer profile with system user
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_customers_user'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT fk_customers_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
