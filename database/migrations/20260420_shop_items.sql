-- Migration: Create shop_items table
-- Ticket #19 — QR Code Wallet shop catalogue
-- Run: npx ts-node database/execute-sql.ts database/migrations/20260420_shop_items.sql

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.shop_items (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    price_credits INTEGER NOT NULL CHECK (price_credits > 0),
    category      TEXT NOT NULL DEFAULT 'general',
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. updated_at auto-trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_shop_items_updated_at'
    ) THEN
        CREATE TRIGGER update_shop_items_updated_at
        BEFORE UPDATE ON public.shop_items
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- 3. RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'shop_items' AND policyname = 'Admins manage shop items'
    ) THEN
        CREATE POLICY "Admins manage shop items"
        ON public.shop_items FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('sys-admin', 'admin')
            )
        );
    END IF;
END $$;

-- 4. Service role access
GRANT ALL ON public.shop_items TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.shop_items_id_seq TO service_role;

-- 5. Seed starting items (idempotent)
INSERT INTO public.shop_items (name, price_credits, category)
VALUES
    ('Infusion - Salty Berry', 16, 'drinks'),
    ('David Protein Bar',      12, 'snacks')
ON CONFLICT DO NOTHING;
