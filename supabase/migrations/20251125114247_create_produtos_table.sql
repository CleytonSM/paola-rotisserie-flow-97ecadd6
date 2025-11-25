-- 1. Catalog / Master products (the "template" product)
CREATE TABLE product_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),  -- price per kg or per unit
    internal_code VARCHAR(50),                                 -- your internal SKU
    catalog_barcode BIGINT,                                    -- fixed EAN-13 for the product type (optional)
    shelf_life_days INTEGER CHECK (shelf_life_days IS NULL OR shelf_life_days > 0),
    default_discount NUMERIC(4,3) CHECK (default_discount IS NULL OR (default_discount >= 0 AND default_discount <= 1)),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_catalog_internal_code ON product_catalog(internal_code);
CREATE INDEX idx_product_catalog_barcode ON product_catalog(catalog_barcode);
CREATE INDEX idx_product_catalog_active ON product_catalog(is_active) WHERE is_active = true;

-- 2. Individual weighed items (one row = one physical label from the scale)
CREATE TABLE product_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    catalog_id UUID NOT NULL REFERENCES product_catalog(id) ON DELETE RESTRICT,
    
    -- Unique code printed on the scale label (scale-generated barcode number)
    scale_barcode BIGINT NOT NULL UNIQUE,
    
    -- Exact moment the item was weighed/produced
    produced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Expiration date (calculated from shelf_life_days + produced_at)
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Actual weight in kilograms (e.g. 1.235 kg)
    weight_kg DECIMAL(8,3) NOT NULL CHECK (weight_kg > 0),
    
    -- Final price that was printed on the label
    sale_price DECIMAL(10,2) NOT NULL CHECK (sale_price >= 0),
    
    -- Specific discount applied to THIS item only (e.g. near-expiry promo)
    item_discount NUMERIC(4,3) 
        CHECK (item_discount IS NULL OR (item_discount >= 0 AND item_discount <= 1)),
    
    -- Lifecycle status
    status TEXT NOT NULL DEFAULT 'available' 
        CHECK (status IN ('available', 'sold', 'reserved', 'expired', 'discarded')),
    
    sold_at TIMESTAMPTZ,
    sale_id UUID,  -- optional FK to sales/sale_items table
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical indexes for performance
CREATE INDEX idx_product_item_catalog ON product_item(catalog_id);
CREATE INDEX idx_product_item_scale_barcode ON product_item(scale_barcode);
CREATE INDEX idx_product_item_expires ON product_item(expires_at);
CREATE INDEX idx_product_item_status ON product_item(status);
CREATE INDEX idx_product_item_available_expiring 
    ON product_item(expires_at) 
    WHERE status = 'available';

-- RLS (if you're using Supabase or similar)
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access catalog" ON product_catalog FOR ALL 
    USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access items" ON product_item FOR ALL 
    USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_catalog_updated_at
    BEFORE UPDATE ON product_catalog FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_product_item_updated_at
    BEFORE UPDATE ON product_item FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

-- Auto-calculate expiration date on insert/update
CREATE OR REPLACE FUNCTION set_expiration_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.produced_at IS NOT NULL THEN
        SELECT (NEW.produced_at::date + shelf_life_days)::timestamptz + interval '23:59:59'
        INTO NEW.expires_at
        FROM product_catalog
        WHERE id = NEW.catalog_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_expiration
    BEFORE INSERT OR UPDATE ON product_item
    FOR EACH ROW EXECUTE FUNCTION set_expiration_date();