const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

function loadEnv(file: string) {
    const envPath = path.resolve(process.cwd(), file);
    const result: Record<string, string> = {};
    if (!fs.existsSync(envPath)) return result;
    fs.readFileSync(envPath, 'utf8').split('\n').forEach((line: string) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
            if (key && !key.startsWith('#')) result[key] = value;
        }
    });
    return result;
}

// Run against test DB by default; pass --live flag for production
const envFile = process.argv.includes('--live') ? '.env.production.latest' : '.env.test.latest';
const env = loadEnv(envFile);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
    console.log(`🛒 Running shop_items migration on: ${envFile}`);

    // 1. Create table
    const createSQL = `
        CREATE TABLE IF NOT EXISTS public.shop_items (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            price_credits INTEGER NOT NULL CHECK (price_credits > 0),
            category    TEXT NOT NULL DEFAULT 'general',
            active      BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- updated_at trigger (reuse existing function if present)
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'update_shop_items_updated_at'
            ) THEN
                CREATE TRIGGER update_shop_items_updated_at
                BEFORE UPDATE ON public.shop_items
                FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
            END IF;
        END $$;

        -- RLS
        ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

        -- Admins full access
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

        -- Service role reads all (for API routes)
        GRANT ALL ON public.shop_items TO service_role;
        GRANT USAGE, SELECT ON SEQUENCE public.shop_items_id_seq TO service_role;
    `;

    const { error: createErr } = await supabase.rpc('run_sql', { sql_query: createSQL });
    if (createErr) {
        console.error('❌ Create table failed:', createErr.message);
        process.exit(1);
    }
    console.log('✅ Table created / verified');

    // 2. Seed starting items (idempotent — skip if name already exists)
    const seedItems = [
        { name: 'Infusion - Salty Berry', price_credits: 16, category: 'drinks' },
        { name: 'David Protein Bar', price_credits: 12, category: 'snacks' },
    ];

    for (const item of seedItems) {
        const { data: existing } = await supabase
            .from('shop_items')
            .select('id')
            .eq('name', item.name)
            .single();

        if (existing) {
            console.log(`⏭  Skipping "${item.name}" — already exists (id: ${existing.id})`);
            continue;
        }

        const { error: insertErr } = await supabase.from('shop_items').insert(item);
        if (insertErr) {
            console.error(`❌ Failed to seed "${item.name}":`, insertErr.message);
        } else {
            console.log(`✅ Seeded: ${item.name} — ${item.price_credits} credits`);
        }
    }

    console.log('\n🎉 shop_items migration complete!');
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
