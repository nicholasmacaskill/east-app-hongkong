import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
    try {
        // 1. Check Supabase Connectivity
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const isPlaceholder = supabaseUrl?.includes('placeholder');
        
        if (!supabaseUrl || isPlaceholder) {
            return NextResponse.json(
                {
                    status: 'unhealthy',
                    reason: isPlaceholder ? 'placeholder_url' : 'missing_url',
                    url_preview: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'N/A'
                },
                { status: 503 }
            );
        }

        // 2. Run a simple query to verify database connection
        const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });

        if (error) {
            throw error;
        }

        return NextResponse.json(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                environment: process.env.NODE_ENV,
                url_ok: true
            },
            { status: 200 }
        );
    } catch (e: any) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: e.message
            },
            { status: 503 }
        );
    }
}
