-- Create Golf Stats Table
CREATE TABLE IF NOT EXISTS public.golf_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
    handicap NUMERIC(4, 1) DEFAULT 0,
    average_score INTEGER DEFAULT 0,
    rounds_played INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    driver_distance INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.golf_stats ENABLE ROW LEVEL SECURITY;

-- Policies

-- Public Read
CREATE POLICY "Public can view golf stats"
ON public.golf_stats FOR SELECT
USING (true);

-- User Update Own Stats
CREATE POLICY "Users can update own golf stats"
ON public.golf_stats FOR UPDATE
USING (auth.uid() = player_id);

-- User Insert Own Stats
CREATE POLICY "Users can insert own golf stats"
ON public.golf_stats FOR INSERT
WITH CHECK (auth.uid() = player_id);

-- Grant Access
GRANT SELECT, INSERT, UPDATE ON public.golf_stats TO authenticated;
GRANT SELECT ON public.golf_stats TO anon;
