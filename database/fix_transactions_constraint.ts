import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTransactionsTable() {
    console.log('🔧 Fixing Transactions Table Constraint...\n');

    // First, let's check if the table exists
    const { data: tables, error: tableError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);

    if (tableError) {
        console.log('❌ Table does not exist or is inaccessible:', tableError.message);
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
        console.log(`
-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    type text NOT NULL,
    stripe_session_id text UNIQUE,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Drop old constraint if exists
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new constraint with all types
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('topup', 'membership', 'transfer', 'booking', 'refund', 'manual'));

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- Policy: Users can see their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Admins can view and insert all
CREATE POLICY "Admins can view all transactions" 
ON public.transactions FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'sys-admin' OR role = 'admin')
));
        `);
        return;
    }

    console.log('✅ Transactions table exists');
    console.log('\n📋 To fix the constraint, please run this SQL in Supabase SQL Editor:\n');
    console.log(`
-- Drop old constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new constraint with all types including 'manual'
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('topup', 'membership', 'transfer', 'booking', 'refund', 'manual'));
    `);

    // Test insert to verify the issue
    console.log('\n🧪 Testing insert with "transfer" type...');
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy ID
    const { error: insertError } = await supabase
        .from('transactions')
        .insert({
            user_id: testUserId,
            amount: 10,
            type: 'transfer',
            description: 'Test insert'
        });

    if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        console.log('   This confirms the constraint needs to be fixed manually.');
    } else {
        console.log('✅ Insert succeeded! Constraint is working.');
        // Clean up test insert
        await supabase.from('transactions').delete().eq('user_id', testUserId);
    }
}

fixTransactionsTable().catch(console.error);
