-- Platform-wide settings (singleton row) for Stripe Connect and future tenant config.
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id text PRIMARY KEY,
    stripe_account_id text,
    stripe_charges_enabled boolean NOT NULL DEFAULT false,
    stripe_payouts_enabled boolean NOT NULL DEFAULT false,
    stripe_details_submitted boolean NOT NULL DEFAULT false,
    stripe_onboarding_complete boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.platform_settings (id)
VALUES ('platform')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'platform_settings'
          AND policyname = 'Sys admins can manage platform settings'
    ) THEN
        CREATE POLICY "Sys admins can manage platform settings"
        ON public.platform_settings
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                  AND role IN ('admin', 'sys-admin')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                  AND role IN ('admin', 'sys-admin')
            )
        );
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;