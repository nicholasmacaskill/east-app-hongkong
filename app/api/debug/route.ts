import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  // 1. Check if Environment Variables are loaded
  const status = {
    env: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Loaded' : '❌ MISSING',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Loaded' : '❌ MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Loaded' : '❌ MISSING',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Loaded' : '❌ MISSING',
    },
    database: 'Checking...',
  };

  // 2. Test Database Admin Connection
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try to count profiles (simple read)
    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      status.database = `❌ Error: ${error.message}`;
    } else {
      status.database = `✅ Connected! (Found ${count} profiles)`;
    }
  } catch (err: any) {
    status.database = `❌ CRITICAL FAIL: ${err.message}`;
  }

  return NextResponse.json(status, { status: 200 });
}