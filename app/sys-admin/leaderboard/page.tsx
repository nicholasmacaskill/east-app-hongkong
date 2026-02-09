'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldLeaderboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/sys-admin/stats');
    }, [router]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-black italic uppercase mb-4">Redirecting...</h1>
                <p className="text-gray-400">This page has moved to Stats Management</p>
            </div>
        </div>
    );
}
