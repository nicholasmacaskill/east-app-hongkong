'use client';
import dynamic from 'next/dynamic';

const DashboardContent = dynamic(() => import('./DashboardContent'), { ssr: false });

export default function EngineeringTickets() {
    if (process.env.NEXT_PUBLIC_STRIPE_MODE === 'test') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-red-500/20 bg-[#1a1a1a] rounded-2xl p-8 text-center max-w-2xl mx-auto mt-20">
                <h1 className="text-red-500 font-bold uppercase tracking-widest text-2xl mb-4">Live Tickets Only</h1>
                <p className="text-gray-400">
                    To prevent database syncing conflicts and enforce our CI/CD Clearance Gates, the Engineering Tickets board is disabled in the Staging Environment.
                </p>
                <div className="mt-8 bg-black/40 text-left p-6 rounded-md border border-white/10">
                    <p className="text-gray-500 text-sm italic font-mono mb-2">// 🚀 SINGLE SOURCE OF TRUTH REQUIRED</p>
                    <p className="text-white font-bold leading-relaxed">
                        Please open <a href="https://app.eastsportsgroup.com/sys-admin" target="_blank" className="text-blue-500 underline mx-1">the Live Admin Panel</a> 
                        to file bug reports or clear tickets for deployment.
                    </p>
                </div>
            </div>
        );
    }
    
    return <DashboardContent />;
}
