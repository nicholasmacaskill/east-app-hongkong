-- Drop any existing policies on messages
DROP POLICY IF EXISTS "Users can view sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete sent messages" ON public.messages;
DROP POLICY IF EXISTS "Team members can view team messages" ON public.messages;

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view messages they sent
CREATE POLICY "Users can view sent messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id);

-- 2. Anyone can view messages they received directly
CREATE POLICY "Users can view received messages"
ON public.messages FOR SELECT
USING (auth.uid() = receiver_id);

-- 3. Team members can view messages sent to their team
CREATE POLICY "Team members can view team messages"
ON public.messages FOR SELECT
USING (
    team_id IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = messages.team_id 
        AND team_members.user_id = auth.uid()
    )
);

-- 4. Users can insert messages (Direct or Team) as long as they are the sender
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 5. Users can delete their own messages
CREATE POLICY "Users can delete sent messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);
