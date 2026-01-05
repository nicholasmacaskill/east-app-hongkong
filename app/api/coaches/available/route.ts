import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';



export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!startTime || !endTime) {
        return NextResponse.json({ error: 'Missing startTime or endTime' }, { status: 400 });
    }

    console.log(`Checking coaches for: ${startTime} to ${endTime}`);

    try {
        // Query coaches who have availability covering this range
        const supabaseAdmin = getSupabaseAdmin();
        const { data: availability, error } = await supabaseAdmin
            .from('availability')
            .select(`
                coach_id,
                profiles:coach_id (
                    id,
                    first_name,
                    last_name,
                    avatar_url,
                    role,
                    bio
                )
            `)
            .eq('status', 'available')
            .lte('start_time', startTime)
            .gte('end_time', endTime);

        if (error) {
            console.error('Fetch Available Coaches Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Found ${availability?.length || 0} availability blocks`);

        // De-duplicate coaches
        const coaches = availability
            .map((a: any) => a.profiles)
            .filter((p: any) => p !== null);

        const uniqueCoaches = Array.from(new Map(coaches.map((c: any) => [c.id, c])).values());

        console.log(`Unique coaches found: ${uniqueCoaches.length}`);

        return NextResponse.json(uniqueCoaches);

    } catch (e: any) {
        console.error('Available Coaches API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
