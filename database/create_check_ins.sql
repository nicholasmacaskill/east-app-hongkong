-- Create check_ins table for gym entry tracking
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Admins can insert check-ins" ON public.check_ins;

-- Policies
CREATE POLICY "Admins can view all check-ins" ON public.check_ins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'sys-admin')
        )
    );

CREATE POLICY "Users can view own check-ins" ON public.check_ins
    FOR SELECT USING (auth.uid() = user_id);

-- Explicitly allow service_role and admins to insert
CREATE POLICY "Admins can insert check-ins" ON public.check_ins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'sys-admin')
        )
    );
