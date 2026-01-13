-- 1. Create the table if it's missing (Safe idempotent check)
CREATE TABLE IF NOT EXISTS public.session_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('CLASS', 'PRIVATE')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the junction table if missing
CREATE TABLE IF NOT EXISTS public.coach_services (
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type_id UUID NOT NULL REFERENCES public.session_types(id) ON DELETE CASCADE,
    PRIMARY KEY (coach_id, session_type_id)
);

-- 3. Enable RLS (Safe to run multiple times)
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_services ENABLE ROW LEVEL SECURITY;

-- 4. Re-apply Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Public Read Session Types" ON public.session_types;
CREATE POLICY "Public Read Session Types" ON public.session_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Session Types" ON public.session_types;
CREATE POLICY "Admin All Session Types" ON public.session_types FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'sys-admin')
);

DROP POLICY IF EXISTS "Public Read Coach Services" ON public.coach_services;
CREATE POLICY "Public Read Coach Services" ON public.coach_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Coach Services" ON public.coach_services;
CREATE POLICY "Admin All Coach Services" ON public.coach_services FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'sys-admin')
);

-- 5. Seed default types if empty
INSERT INTO public.session_types (title, category, image_url) VALUES
('Hyrox', 'CLASS', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/hyrox_b8249f8b-911d-466f-bd0f-a6c32a096647.png?v=1724730513'),
('EAST60', 'CLASS', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/WhatsApp_Image_2024-08-27_at_11.46.59.jpg?v=1724730513'),
('Shooting', 'PRIVATE', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161'),
('Golf', 'PRIVATE', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257'),
('Personal Training', 'PRIVATE', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250')
ON CONFLICT DO NOTHING;

-- 6. Upgrade sessions table for better service tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='session_type_id') THEN
        ALTER TABLE public.sessions ADD COLUMN session_type_id UUID REFERENCES public.session_types(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='capacity') THEN
        ALTER TABLE public.sessions ADD COLUMN capacity INTEGER DEFAULT 1;
    END IF;
END $$;

-- 7. CRITICAL: Reload Schema Cache
NOTIFY pgrst, 'reload schema';
