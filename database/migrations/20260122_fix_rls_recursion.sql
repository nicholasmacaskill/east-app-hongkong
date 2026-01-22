-- Migration: Fix RLS Infinite Recursion (Bug #14)
-- Date: 2026-01-22
-- Reason: Policies checking public.profiles were recursively calling themselves.

-- 1. Create a Security Definer function to check roles
-- This function runs as the owner (bypassing RLS) but checks the caller's ID.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Admin/Coach can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parent can view children profiles" ON public.profiles;

-- 3. Re-implement without recursion
CREATE POLICY "Admin/Coach can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
    get_auth_role() IN ('admin', 'sys-admin', 'coach')
);

CREATE POLICY "Parent can view children profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
    parent_id = auth.uid()
);

-- Note: "Users can view own profile" (id = auth.uid()) is already safe and doesn't need the function.
