-- Drill Hub Database Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.coach_drills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    age_tags text[] DEFAULT '{}'::text[],
    level_tags text[] DEFAULT '{}'::text[],
    group_tags text[] DEFAULT '{}'::text[],
    skill_tags text[] DEFAULT '{}'::text[],
    status text DEFAULT 'published',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coach_drill_steps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,
    step_order integer NOT NULL,
    title text,
    description text NOT NULL,
    image_url text, -- To be populated in Phase 2 with Base64 or Object Storage URLs
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.coach_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_drill_steps ENABLE ROW LEVEL SECURITY;

-- Viewing Policies: Authenticated users can view drills
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'coach_drills' AND policyname = 'Anyone can view published drills'
    ) THEN
        CREATE POLICY "Anyone can view published drills" ON public.coach_drills FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'coach_drill_steps' AND policyname = 'Anyone can view drill steps'
    ) THEN
        CREATE POLICY "Anyone can view drill steps" ON public.coach_drill_steps FOR SELECT USING (true);
    END IF;
END $$;

-- Execution Grants
GRANT ALL ON public.coach_drills TO service_role;
GRANT ALL ON public.coach_drill_steps TO service_role;
GRANT SELECT ON public.coach_drills TO authenticated;
GRANT SELECT ON public.coach_drill_steps TO authenticated;
