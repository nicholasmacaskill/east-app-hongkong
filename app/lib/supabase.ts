import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('❌ Supabase Env Missing (NEXT_PUBLIC_SUPABASE_URL): Client-side requests will fail with "Failed to Fetch". Check GitHub secrets for your environment (e.g., "test").')
}
if (!supabaseKey || supabaseKey === 'placeholder-key') {
  console.error('❌ Supabase Key Missing (NEXT_PUBLIC_SUPABASE_ANON_KEY): Authentication will fail.')
}

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)