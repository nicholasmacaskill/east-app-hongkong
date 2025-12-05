import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase values if .env is not working
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zhekqzgvgdlkxrqitpkx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZWtxemd2Z2Rsa3hycWl0cGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTA3MzAsImV4cCI6MjA4MDM2NjczMH0.7t6SraFggx5p89DcBSBx8RRgXXnEEqeDTAx6KWzoqiQ';

export const supabase = createClient(supabaseUrl, supabaseKey);