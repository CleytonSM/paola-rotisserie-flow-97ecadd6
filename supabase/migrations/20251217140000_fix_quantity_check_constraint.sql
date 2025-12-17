-- Fix quantity check constraint to allow zero
-- The previous constraint was "quantity > 0" which prevented products from reaching 0 stock
-- This change allows "quantity >= 0" so products can be fully sold out

-- First, drop the existing constraint
ALTER TABLE public.product_catalog 
DROP CONSTRAINT IF EXISTS product_catalog_quantity_check;

-- Add the corrected constraint that allows zero
ALTER TABLE public.product_catalog 
ADD CONSTRAINT product_catalog_quantity_check CHECK (quantity >= 0);
