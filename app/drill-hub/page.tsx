import React, { Suspense } from 'react';
import DrillHubScreen from '@/app/components/screens/DrillHubScreen';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export const revalidate = 60; // Cache the page for 60 seconds to improve performance

export default async function DrillHubPage() {
    const supabase = getSupabaseAdmin();
    
    // Fetch data on the server to prevent client-side waterfall
    const [{ data: initialDrills }, { data: initialPlans }] = await Promise.all([
        supabase
            .from('coach_drills')
            .select('*, coach:profiles(first_name, last_name, avatar_url)')
            .order('created_at', { ascending: false }),
        supabase
            .from('training_plans')
            .select('*, coach:profiles(first_name, last_name, avatar_url)')
            .order('created_at', { ascending: false })
    ]);

    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-montserrat uppercase font-black tracking-widest text-xs animate-pulse">Loading Hub...</div>}>
            <DrillHubScreen 
                initialDrills={initialDrills || []} 
                initialPlans={initialPlans || []} 
            />
        </Suspense>
    );
}
