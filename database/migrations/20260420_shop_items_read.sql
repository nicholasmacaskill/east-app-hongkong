-- Migration: Add SELECT policy for authenticated users on shop_items
-- Run: npx ts-node database/execute-sql.ts database/migrations/20260420_shop_items_read.sql

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'shop_items' AND policyname = 'Anyone can view active shop items'
    ) THEN
        CREATE POLICY "Anyone can view active shop items"
        ON public.shop_items FOR SELECT TO authenticated
        USING (active = true);
    END IF;
END $$;
