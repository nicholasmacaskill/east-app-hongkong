-- Create session_types table
CREATE TABLE IF NOT EXISTS public.session_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('CLASS', 'PRIVATE', 'FACILITY')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create coach_services junction table
CREATE TABLE IF NOT EXISTS public.coach_services (
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type_id UUID NOT NULL REFERENCES public.session_types(id) ON DELETE CASCADE,
    PRIMARY KEY (coach_id, session_type_id)
);

-- Enable RLS
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_services ENABLE ROW LEVEL SECURITY;

-- Policies for session_types (Public Read, Admin Write)
CREATE POLICY "Public Read Session Types" ON public.session_types FOR SELECT USING (true);
CREATE POLICY "Admin All Session Types" ON public.session_types FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'sys-admin')
);

-- Policies for coach_services (Public Read, Admin Write)
CREATE POLICY "Public Read Coach Services" ON public.coach_services FOR SELECT USING (true);
CREATE POLICY "Admin All Coach Services" ON public.coach_services FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'sys-admin')
);

-- Initial Seed Data
INSERT INTO public.session_types (title, category, image_url) VALUES
('Hyrox', 'CLASS', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/hyrox_b8249f8b-911d-466f-bd0f-a6c32a096647.png?v=1724730513'),
('EAST60', 'CLASS', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/WhatsApp_Image_2024-08-27_at_11.46.59.jpg?v=1724730513'),
('Shooting', 'PRIVATE', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161'),
('Golf', 'PRIVATE', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257'),
('Gym', 'PRIVATE', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250')
ON CONFLICT DO NOTHING;
