import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
    try {
        // Run a simple query to verify database connection
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            throw error;
        }

        return NextResponse.json(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                environment: process.env.NODE_ENV
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
