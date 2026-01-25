'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Copy } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        console.error(error);
    }, [error]);

    const handleCopyDebugInfo = async () => {
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: { user } } = await supabase.auth.getUser();

            const debugInfo = {
                timestamp: new Date().toISOString(),
                url: typeof window !== 'undefined' ? window.location.href : 'server-side',
                error: {
                    message: error.message,
                    stack: error.stack,
                    digest: error.digest,
                },
                userId: user?.id || 'anonymous/unauthenticated'
            };

            await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy debug info:', err);
            // Fallback: minimal info if auth/complex stuff fails
            const minimalInfo = {
                error: error.message,
                timestamp: new Date().toISOString()
            };
            await navigator.clipboard.writeText(JSON.stringify(minimalInfo));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-montserrat">
            <AlertTriangle size={64} className="text-red-500 mb-6" />
            <h2 className="text-2xl font-black italic uppercase tracking-widest mb-2">Technical Foul</h2>
            <p className="text-gray-400 max-w-md mb-8 text-sm">
                Something went wrong on our end. We've logged the error.
            </p>

            {showManualCopy ? (
                <div className="w-full max-w-md bg-gray-900 p-4 rounded-lg mb-4 text-left">
                    <p className="text-xs text-yellow-500 mb-2">Clipboard API unavailable. Please select all and copy:</p>
                    <textarea
                        readOnly
                        value={debugData || error.message}
                        className="w-full h-32 bg-black text-green-400 text-xs font-mono p-2 rounded border border-gray-700 focus:outline-none"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                        onClick={() => setShowManualCopy(false)}
                        className="mt-2 text-xs text-gray-500 hover:text-white underline"
                    >
                        Close Debug View
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => reset()}
                        className="bg-east-light text-black font-black italic uppercase px-8 py-3 rounded-full hover:bg-white transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={handleCopyDebugInfo}
                        className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-gray-500 hover:text-white transition-colors"
                    >
                        <Copy size={12} />
                        {copied ? 'Copied!' : 'Copy Debug Info'}
                    </button>
                </div>
            )}
        </div>
    );
}
