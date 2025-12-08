-- Remove unique constraint from scale_barcode in product_item table
-- This allows multiple product items to share the same scale barcode if needed

ALTER TABLE product_item 
DROP CONSTRAINT IF EXISTS product_item_scale_barcode_key;

-- Note: The index idx_product_item_scale_barcode will remain for query performance
-- It just won't enforce uniqueness anymore
