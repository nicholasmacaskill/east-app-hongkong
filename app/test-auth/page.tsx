'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function TestAuth() {
    const [status, setStatus] = useState('Testing...');
    const [error, setError] = useState('');

    useEffect(() => {
        const testAuth = async () => {
            try {
                console.log('Testing Supabase connection...');
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: 'admin@east.com',
                    password: 'password123',
                });

                if (error) {
                    console.error('Auth error:', error);
                    setError(JSON.stringify(error, null, 2));
                    setStatus('Failed');
                } else {
                    console.log('Auth success:', data);
                    setStatus('Success!');
                }
            } catch (e: any) {
                console.error('Caught error:', e);
                setError(e.message || e.toString());
                setStatus('Exception thrown');
            }
        };

        testAuth();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Auth Test Page</h1>
            <p><strong>Status:</strong> {status}</p>
            {error && (
                <pre style={{ background: '#fee', padding: '10px', overflow: 'auto' }}>
                    {error}
                </pre>
            )}
        </div>
    );
}
