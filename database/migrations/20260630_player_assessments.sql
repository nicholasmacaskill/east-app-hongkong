-- Private player video/photo assessments (not in public drill hub)

CREATE TABLE IF NOT EXISTS public.player_assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    notes text DEFAULT '',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.player_assessment_media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid NOT NULL REFERENCES public.player_assessments(id) ON DELETE CASCADE,
    media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS shared_assessment_id uuid REFERENCES public.player_assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_player_assessments_player ON public.player_assessments(player_id);
CREATE INDEX IF NOT EXISTS idx_player_assessments_coach ON public.player_assessments(coach_id);
CREATE INDEX IF NOT EXISTS idx_player_assessment_media_assessment ON public.player_assessment_media(assessment_id);

ALTER TABLE public.player_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_assessment_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own assessments" ON public.player_assessments;
DROP POLICY IF EXISTS "Players read own assessments" ON public.player_assessments;
DROP POLICY IF EXISTS "Admins read all assessments" ON public.player_assessments;

CREATE POLICY "Coaches manage own assessments" ON public.player_assessments
    FOR ALL TO authenticated
    USING (auth.uid() = coach_id)
    WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Players read own assessments" ON public.player_assessments
    FOR SELECT TO authenticated
    USING (auth.uid() = player_id);

CREATE POLICY "Admins read all assessments" ON public.player_assessments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'sys-admin')
        )
    );

DROP POLICY IF EXISTS "Assessment media readable by participants" ON public.player_assessment_media;
DROP POLICY IF EXISTS "Coaches manage assessment media" ON public.player_assessment_media;

CREATE POLICY "Coaches manage assessment media" ON public.player_assessment_media
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.player_assessments pa
            WHERE pa.id = assessment_id AND pa.coach_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.player_assessments pa
            WHERE pa.id = assessment_id AND pa.coach_id = auth.uid()
        )
    );

CREATE POLICY "Assessment media readable by participants" ON public.player_assessment_media
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.player_assessments pa
            WHERE pa.id = assessment_id
            AND (pa.coach_id = auth.uid() OR pa.player_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'sys-admin')
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_assessment_media TO authenticated;
GRANT ALL ON public.player_assessments TO service_role;
GRANT ALL ON public.player_assessment_media TO service_role;

NOTIFY pgrst, 'reload schema';