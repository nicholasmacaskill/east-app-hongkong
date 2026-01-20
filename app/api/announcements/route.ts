import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'news' or 'event' or null for all

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let query = supabase
            .from('announcements')
            .select('*')
            .eq('published', true);

        if (type) {
            query = query.eq('type', type);
        }

        // For events, only show future events
        if (type === 'event') {
            query = query.gte('event_date', new Date().toISOString());
        }

        query = query.order('created_at', { ascending: false });

        const { data: announcements, error } = await query;

        if (error) {
            console.error('Error fetching public announcements:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(announcements);
    } catch (e: any) {
        console.error('Public Announcements Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
