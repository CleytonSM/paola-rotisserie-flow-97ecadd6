-- Create app_settings table (singleton pattern enforced by logic or checking only 1 row, but here just a standard table)
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_cnpj VARCHAR(20),
    store_name VARCHAR(255),
    store_address_street VARCHAR(255),
    store_address_number VARCHAR(50),
    store_address_complement VARCHAR(255),
    store_address_neighborhood VARCHAR(100),
    store_address_city VARCHAR(100),
    store_address_state VARCHAR(2),
    store_address_zip_code VARCHAR(10),
    fixed_delivery_fee DECIMAL(10,2) DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON app_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert/update for owners" ON app_settings
    FOR ALL USING (
        public.has_role(auth.uid(), 'owner')
    );


-- Create client_addresses table
CREATE TABLE IF NOT EXISTS client_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(50) NOT NULL,
    complement VARCHAR(255),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for client_addresses
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON client_addresses
    FOR ALL USING (auth.role() = 'authenticated');


-- Add delivery fields to sales
ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS is_delivery BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS delivery_address_id UUID REFERENCES client_addresses(id),
    ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;


-- Trigger to handle is_default logic for addresses (optional but good UI/UX)
-- When a new default is set, unset others for the same client.
CREATE OR REPLACE FUNCTION handle_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE client_addresses
        SET is_default = false
        WHERE client_id = NEW.client_id
          AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_address_default_change
    BEFORE INSERT OR UPDATE OF is_default ON client_addresses
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION handle_default_address();
