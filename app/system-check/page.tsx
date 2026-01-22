'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { fetchProfileResilient } from '@/app/lib/authProfile';

export default function SystemCheck() {
    const [status, setStatus] = useState<any>({
        auth: 'checking...',
        profile: 'checking...',
        database: 'checking...'
    });

    useEffect(() => {
        const runCheck = async () => {
            const newStatus: any = {};

            // 1. Auth Check
            const { data: { user } } = await supabase.auth.getUser();
            newStatus.auth = user ? { id: user.id, email: user.email, metadata_role: user.user_metadata?.role } : 'Not Logged In';

            if (user) {
                // 2. Profile Check
                const profile = await fetchProfileResilient(user.id);
                newStatus.profile = profile || 'No profile found in database';

                // 3. Database Check
                const { data: types, error } = await supabase.from('session_types').select('count', { count: 'exact' });
                newStatus.database = error ? `Error: ${error.message}` : `${types?.length || 0} Core Services found`;
            }

            setStatus(newStatus);
        };
        runCheck();
    }, []);

    return (
        <div className="p-10 bg-black min-h-screen text-green-500 font-mono text-xs">
            <h1 className="text-xl mb-4 font-bold border-b border-green-900 pb-2">SYSTEM DIAGNOSTIC</h1>
            <pre className="bg-gray-900 p-6 rounded-xl border border-green-800 overflow-x-auto">
                {JSON.stringify(status, null, 2)}
            </pre>
            <div className="mt-6 text-gray-500">
                If the Auth ID exists but Profile says "No profile found", we have a synchronization issue.
                If Database says "0 services", the app is pointing to an empty Supabase project.
            </div>
        </div>
    );
}
