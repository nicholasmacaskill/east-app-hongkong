'use client';
import { useState } from 'react';

export default function DirectFetchTest() {
    const [result, setResult] = useState<any>({});

    const testFetch = async () => {
        try {
            setResult({ status: 'Fetching...' });

            const response = await fetch('http://localhost:54321/auth/v1/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                }
            });

            const data = await response.json();
            setResult({
                status: response.status,
                ok: response.ok,
                data
            });
        } catch (e: any) {
            setResult({
                status: 'Error',
                message: e.message,
                stack: e.stack
            });
        }
    };

    return (
        <div className="p-8 text-white bg-black min-h-screen font-mono">
            <h1 className="text-xl mb-4">Direct Fetch Test</h1>
            <button
                onClick={testFetch}
                className="px-4 py-2 bg-blue-600 rounded mb-4 hover:bg-blue-500"
            >
                Test Connection to Supabase
            </button>

            <pre className="bg-gray-900 p-4 rounded border border-gray-700 overflow-auto">
                {JSON.stringify(result, null, 2)}
            </pre>

            <div className="mt-8">
                <h2 className="text-lg mb-2">Config:</h2>
                <div className="text-sm text-gray-400">
                    URL: http://localhost:54321<br />
                    Key Present: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}
                </div>
            </div>
        </div>
    );
}
