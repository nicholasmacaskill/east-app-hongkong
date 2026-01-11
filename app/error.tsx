
'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-montserrat">
            <AlertTriangle size={64} className="text-red-500 mb-6" />
            <h2 className="text-2xl font-black italic uppercase tracking-widest mb-2">Technical Foul</h2>
            <p className="text-gray-400 max-w-md mb-8 text-sm">
                Something went wrong on our end. We've logged the error.
            </p>
            <button
                onClick={() => reset()}
                className="bg-east-light text-black font-black italic uppercase px-8 py-3 rounded-full hover:bg-white transition-colors"
            >
                Try Again
            </button>
        </div>
    );
}
