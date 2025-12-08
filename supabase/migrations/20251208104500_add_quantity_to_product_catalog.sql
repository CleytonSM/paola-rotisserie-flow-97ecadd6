-- Add quantity to product_catalog for non-internal products
ALTER TABLE product_catalog 
ADD COLUMN quantity INTEGER CHECK (quantity > 0);
