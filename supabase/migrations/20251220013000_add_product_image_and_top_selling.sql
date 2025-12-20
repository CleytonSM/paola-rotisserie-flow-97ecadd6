-- Add image_url column to product_catalog
ALTER TABLE "public"."product_catalog" 
ADD COLUMN IF NOT EXISTS "image_url" text;

-- Create storage bucket for products if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'products' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' );

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );

-- RPC function to get top selling products
CREATE OR REPLACE FUNCTION public.get_top_selling_products(limit_count int)
RETURNS SETOF product_catalog
LANGUAGE sql
STABLE
AS $$
  SELECT pc.*
  FROM product_catalog pc
  JOIN (
    SELECT product_catalog_id, SUM(quantity) as total_sold
    FROM sale_items
    GROUP BY product_catalog_id
  ) sales ON pc.id = sales.product_catalog_id
  ORDER BY sales.total_sold DESC
  LIMIT limit_count;
$$;

ALTER FUNCTION public.get_top_selling_products(int) OWNER TO postgres;
