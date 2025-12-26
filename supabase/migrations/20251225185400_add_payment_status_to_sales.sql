-- Add payment_status column to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Update existing records to 'paid' as they were likely completed sales
UPDATE public.sales
SET payment_status = 'paid'
WHERE payment_status = 'pending';
