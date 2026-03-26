import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
    try {
        const results: any = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            diagnostics: {}
        };

        // 1. Env Var Check
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        results.diagnostics.url_set = !!supabaseUrl;
        results.diagnostics.key_set = !!supabaseKey;
        
        if (supabaseUrl) {
           results.diagnostics.url_preview = `${supabaseUrl.substring(0, 12)}...${supabaseUrl.substring(supabaseUrl.length - 5)}`;
           results.diagnostics.is_placeholder = supabaseUrl.includes('placeholder');
        }

        // 2. Connectivity Test (External)
        try {
            const googleResponse = await fetch('https://www.google.com', { signal: AbortSignal.timeout(2000) });
            results.diagnostics.external_network = googleResponse.ok ? 'ok' : `failed_${googleResponse.status}`;
        } catch (e: any) {
            results.diagnostics.external_network = `error_${e.message}`;
        }

        // 3. Supabase Direct Connectivity Test
        if (supabaseUrl) {
            try {
                const start = Date.now();
                const sbResponse = await fetch(`${supabaseUrl}/auth/v1/health`, { 
                    signal: AbortSignal.timeout(3000) 
                });
                results.diagnostics.supabase_reachability = sbResponse.ok ? 'ok' : `failed_${sbResponse.status}`;
                results.diagnostics.latency_ms = Date.now() - start;
            } catch (e: any) {
                results.diagnostics.supabase_reachability = `error_${e.message}`;
            }
        }

        // 4. Client SDK Test
        const { data, error: sbError } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        if (sbError) {
             results.status = 'unhealthy';
             results.error = `Supabase SDK Error: ${sbError.message}`;
        } else {
             results.database = 'connected';
        }

        return NextResponse.json(results, { status: results.status === 'healthy' ? 200 : 503 });

    } catch (e: any) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: e.message,
                stack: e.stack?.split('\n')[0]
            },
            { status: 503 }
        );
    }
}
