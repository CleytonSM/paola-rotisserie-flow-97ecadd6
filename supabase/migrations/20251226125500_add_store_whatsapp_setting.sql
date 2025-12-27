-- Add store_whatsapp to app_settings table
ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS store_whatsapp TEXT;

-- Update existing record with a default if it exists (optional, keeping it nullable)
