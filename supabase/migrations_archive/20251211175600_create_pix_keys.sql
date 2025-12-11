-- Create pix_keys table
CREATE TABLE IF NOT EXISTS pix_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('aleatoria', 'telefone', 'cpf', 'cnpj', 'email')),
  key_value VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add constraints for validation (basic regex checks)
-- Note: Postgres regex syntax is slightly different from JS
ALTER TABLE pix_keys ADD CONSTRAINT check_pix_key_format CHECK (
  (type = 'aleatoria') OR -- UUID format check is complex in pure SQL constraint, skipping strict regex for random key to allow flexibility
  (type = 'telefone' AND key_value ~ '^\+?[0-9]{12,14}$') OR -- E.g. +5511999999999
  (type = 'cpf' AND key_value ~ '^[0-9]{11}$') OR -- 11 digits
  (type = 'cnpj' AND key_value ~ '^[0-9]{14}$') OR -- 14 digits
  (type = 'email' AND key_value ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index on active for performance
CREATE INDEX IF NOT EXISTS idx_pix_keys_active ON pix_keys(active);

-- Enable Row Level Security
ALTER TABLE pix_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (assuming authenticated users are admins)
CREATE POLICY "Enable all access for authenticated users" ON pix_keys
  FOR ALL USING (auth.role() = 'authenticated');
