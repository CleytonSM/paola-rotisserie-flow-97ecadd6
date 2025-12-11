-- Update suppliers table: drop contact column and add email and phone columns
DO $$ 
BEGIN
  -- Drop contact column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'suppliers' 
    AND column_name = 'contact'
  ) THEN
    ALTER TABLE public.suppliers DROP COLUMN contact;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'suppliers' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.suppliers 
    ADD COLUMN email VARCHAR(255) UNIQUE;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'suppliers' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.suppliers 
    ADD COLUMN phone VARCHAR(20);
  END IF;
END $$;

