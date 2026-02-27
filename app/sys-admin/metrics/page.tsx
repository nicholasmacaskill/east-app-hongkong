import React from 'react';
import Link from 'next/link';
import KeyMetricsDashboard from '@/app/components/admin/metrics/KeyMetricsDashboard';

export default function AdminMetricsPage() {
    return (
        <div className="flex flex-col gap-8 w-full pb-20 overflow-x-hidden">
            <div className="flex flex-col gap-2">
                <Link href="/sys-admin" className="self-start text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-white mb-4 block transition-colors">← Back to Dashboard</Link>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Key Metrics</h1>
                        <p className="text-gray-400 max-w-2xl">
                            High-level overview of system usage, subscriptions, bookings performance, and cancellations.
                        </p>
                    </div>
                </div>
            </div>

            <KeyMetricsDashboard />
        </div>
    );
}
