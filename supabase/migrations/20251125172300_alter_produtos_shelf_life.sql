-- Alter produtos table: change due_date (DATE) to shelf_life_days (INTEGER)
-- This represents the number of days the product remains valid

-- Drop the old due_date column
ALTER TABLE produtos DROP COLUMN IF EXISTS due_date;

-- Add new shelf_life_days column as INTEGER
ALTER TABLE produtos ADD COLUMN shelf_life_days INTEGER;

-- Add constraint to ensure shelf_life_days is positive when provided
ALTER TABLE produtos
ADD CONSTRAINT chk_produtos_shelf_life_positive
CHECK (shelf_life_days IS NULL OR shelf_life_days > 0);

-- Add index for better query performance
CREATE INDEX idx_produtos_shelf_life ON produtos(shelf_life_days);
