-- Create Produtos table
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(35) NOT NULL,
    due_date DATE,
    barcode BIGINT,
    price DECIMAL(6,2) NOT NULL,
    code VARCHAR(50),
    discount REAL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_produtos_code ON produtos(code);
CREATE INDEX idx_produtos_barcode ON produtos(barcode);
CREATE INDEX idx_produtos_name ON produtos(name);

-- Add constraint to ensure price is positive
ALTER TABLE produtos
ADD CONSTRAINT chk_produtos_price_positive
CHECK (price >= 0);

-- Add constraint to ensure discount is between 0 and 1 (0% to 100%)
ALTER TABLE produtos
ADD CONSTRAINT chk_produtos_discount_range
CHECK (discount IS NULL OR (discount >= 0 AND discount <= 1));

-- Enable Row Level Security
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Full access for authenticated users
CREATE POLICY "Authenticated users full access" ON produtos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_produtos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trg_update_produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_produtos_updated_at();
