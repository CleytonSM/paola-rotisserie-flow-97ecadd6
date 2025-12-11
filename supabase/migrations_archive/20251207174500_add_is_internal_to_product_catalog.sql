-- Add is_internal column to product_catalog table
ALTER TABLE product_catalog 
ADD COLUMN is_internal BOOLEAN DEFAULT true;

-- Update existing records to have is_internal = false if needed, 
-- or keep true as default for safety or per specific requirement. 
-- Given the requirement "by default comes active", we default to true.
-- However, for existing products, we might want to be careful.
-- Assuming standard migration practice:
-- 1. Add column with default true (as requested for new items)
-- 2. Optional: bulk update existing items if they shouldn't be internal (optional, relying on default here)

COMMENT ON COLUMN product_catalog.is_internal IS 'Flag to indicate if the product is manufactured internally (e.g. rotisserie) and requires item selection';
