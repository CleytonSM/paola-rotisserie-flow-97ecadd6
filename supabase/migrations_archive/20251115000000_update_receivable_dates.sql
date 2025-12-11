-- Rename receipt_date to entry_date and remove due_date from accounts_receivable
DO $$ 
BEGIN
  -- Step 1: Rename receipt_date to entry_date if receipt_date exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts_receivable' 
    AND column_name = 'receipt_date'
  ) THEN
    ALTER TABLE public.accounts_receivable 
    RENAME COLUMN receipt_date TO entry_date;
  END IF;

  -- Step 2: Make entry_date NOT NULL (set default for existing NULL values first)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts_receivable' 
    AND column_name = 'entry_date'
  ) THEN
    -- Set default value for any NULL entries (use created_at or current timestamp)
    UPDATE public.accounts_receivable 
    SET entry_date = COALESCE(created_at, NOW())
    WHERE entry_date IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE public.accounts_receivable 
    ALTER COLUMN entry_date SET NOT NULL;
    
    -- Remove default NOW() since it's now required
    ALTER TABLE public.accounts_receivable 
    ALTER COLUMN entry_date DROP DEFAULT;
  END IF;

  -- Step 3: Remove due_date column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts_receivable' 
    AND column_name = 'due_date'
  ) THEN
    ALTER TABLE public.accounts_receivable 
    DROP COLUMN due_date;
  END IF;
END $$;

