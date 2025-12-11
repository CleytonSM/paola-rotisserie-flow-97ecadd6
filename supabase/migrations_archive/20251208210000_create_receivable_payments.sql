-- Create receivable_payments table to track multiple payment methods per receivable
CREATE TABLE IF NOT EXISTS public.receivable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_id UUID NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    card_brand VARCHAR(50),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    pix_key_id UUID REFERENCES public.pix_keys(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable read/write for auth users" ON public.receivable_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Create index for better query performance
CREATE INDEX idx_receivable_payments_receivable_id ON public.receivable_payments(receivable_id);
CREATE INDEX idx_receivable_payments_pix_key_id ON public.receivable_payments(pix_key_id);

-- Add comment
COMMENT ON TABLE public.receivable_payments IS 'Stores multiple payment methods for a single accounts receivable entry (partial payments)';
