-- Add due_date column to accounts_receivable if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts_receivable' 
    AND column_name = 'due_date'
  ) THEN
    ALTER TABLE public.accounts_receivable 
    ADD COLUMN due_date TIMESTAMP WITHOUT TIME ZONE;
  END IF;
END $$;