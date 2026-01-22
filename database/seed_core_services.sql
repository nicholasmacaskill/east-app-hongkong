-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.session_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('CLASS', 'PRIVATE', 'FACILITY')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;

-- 3. Add Policies (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_types' AND policyname = 'Public Read Session Types') THEN
        CREATE POLICY "Public Read Session Types" ON public.session_types FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_types' AND policyname = 'Admin All Session Types') THEN
        CREATE POLICY "Admin All Session Types" ON public.session_types FOR ALL USING (
            exists (select 1 from public.profiles where id = auth.uid() and role = 'sys-admin')
        );
    END IF;
END $$;

-- 4. Safely add description column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'session_types'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.session_types ADD COLUMN description TEXT;
    END IF;
END $$;

-- 5. Populate Core Service Offerings
INSERT INTO public.session_types (title, category, description, image_url)
SELECT * FROM (VALUES
    ('Trackman Range', 'CLASS', 'Group practice session using Trackman technology.', 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800'),
    ('Private Coaching', 'PRIVATE', '1-on-1 personalized instruction.', 'https://images.unsplash.com/photo-1544367563-12123d832e30?w=800'),
    ('Junior Academy', 'CLASS', 'Youth development program.', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800')
) AS v(title, category, description, image_url)
WHERE NOT EXISTS (
    SELECT 1 FROM public.session_types st WHERE st.title = v.title
);
