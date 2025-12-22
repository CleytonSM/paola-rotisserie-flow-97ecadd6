-- Add sound_enabled setting to app_settings table
ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;
