
'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function AdminDebugPage() {
    const [status, setStatus] = useState<any>({ loading: true });

    useEffect(() => {
        const check = async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (!user) {
                setStatus({ loading: false, error: 'No user logged in', authError });
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setStatus({
                loading: false,
                userEmail: user.email,
                userId: user.id,
                profile,
                profileError,
                expectedRole: 'admin',
                actualRole: profile?.role,
                isMatch: profile?.role === 'admin'
            });
        };

        check();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4 text-[#28D160]">Admin Debugger</h1>
            <pre className="bg-[#111] p-4 rounded border border-white/10 overflow-auto">
                {JSON.stringify(status, null, 2)}
            </pre>
            <div className="mt-4">
                <a href="/" className="text-blue-500 underline">Back to Home</a>
            </div>
        </div>
    );
}
