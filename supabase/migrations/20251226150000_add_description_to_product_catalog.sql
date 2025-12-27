-- Migration to add description to product_catalog
ALTER TABLE IF EXISTS public.product_catalog 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update RLS if needed (usually not needed for just a new column if policies are table-wide)
-- But making sure it's visible to public if we are doing a public catalog
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to product_catalog"
ON public.product_catalog
FOR SELECT
TO public
USING (is_active = true);
