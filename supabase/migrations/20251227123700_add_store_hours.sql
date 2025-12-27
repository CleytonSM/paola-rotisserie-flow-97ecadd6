-- Migration to add store_hours table
CREATE TABLE IF NOT EXISTS public.store_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME NOT NULL DEFAULT '10:00',
    close_time TIME NOT NULL DEFAULT '14:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(day_of_week)
);

-- RLS
ALTER TABLE public.store_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on store_hours" ON public.store_hours
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access on store_hours" ON public.store_hours
    FOR ALL USING (auth.role() = 'authenticated');

-- Default data: Tuesday (2) to Sunday (7) open 10h-14h, Monday (1) closed
INSERT INTO public.store_hours (day_of_week, is_open, open_time, close_time) 
VALUES
(1, false, '10:00', '14:00'),
(2, true, '10:00', '14:00'),
(3, true, '10:00', '14:00'),
(4, true, '10:00', '14:00'),
(5, true, '10:00', '14:00'),
(6, true, '10:00', '14:00'),
(7, true, '10:00', '14:00')
ON CONFLICT (day_of_week) DO NOTHING;
