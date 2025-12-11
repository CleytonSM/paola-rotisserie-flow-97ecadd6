-- Add unit_type column to product_catalog table
ALTER TABLE product_catalog 
ADD COLUMN unit_type text NOT NULL DEFAULT 'kg' 
CHECK (unit_type IN ('kg', 'un'));

-- Comment on column
COMMENT ON COLUMN product_catalog.unit_type IS 'Unit type for the product: kg (kilogram) or un (unit)';
