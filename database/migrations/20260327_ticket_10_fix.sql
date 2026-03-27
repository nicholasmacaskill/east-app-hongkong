-- Migration: Resolve Ticket #10 & Enhance Dashboard
-- 1. Identity Sync Trigger: Automatically delete Auth user when Profile is deleted
CREATE OR REPLACE FUNCTION public.handle_profile_delete_sync()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_deleted_sync_auth ON public.profiles;
CREATE TRIGGER on_profile_deleted_sync_auth
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_delete_sync();

-- 2. Dashboard Schema Enhancements
ALTER TABLE public.engineering_tickets 
ADD COLUMN IF NOT EXISTS root_cause TEXT,
ADD COLUMN IF NOT EXISTS resolution TEXT;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
