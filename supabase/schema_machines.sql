-- Create card_machines table
CREATE TABLE IF NOT EXISTS card_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create card_flags table
CREATE TABLE IF NOT EXISTS card_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES card_machines(id) ON DELETE CASCADE NOT NULL,
  brand VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  tax_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on machine_id for performance
CREATE INDEX IF NOT EXISTS idx_card_flags_machine_id ON card_flags(machine_id);

-- Enable Row Level Security
ALTER TABLE card_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_flags ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (assuming authenticated users are admins for this internal tool)
CREATE POLICY "Enable all access for authenticated users" ON card_machines
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON card_flags
  FOR ALL USING (auth.role() = 'authenticated');

-- Storage bucket for machine images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('machine-images', 'machine-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Give public access to machine images" ON storage.objects
  FOR SELECT USING (bucket_id = 'machine-images');

CREATE POLICY "Enable upload for authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'machine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'machine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON storage.objects
  FOR DELETE USING (bucket_id = 'machine-images' AND auth.role() = 'authenticated');
