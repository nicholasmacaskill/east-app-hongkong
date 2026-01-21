'use client';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function MembershipSuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-montserrat">
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full flex flex-col items-center animate-fadeIn">
                <div className="w-20 h-20 bg-east-light/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} className="text-east-light" />
                </div>

                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">
                    Subscribed!
                </h1>

                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-8 leading-relaxed">
                    You are now a member of EAST High Performance Centre. Welcome to the Team!
                </p>

                <button
                    onClick={() => router.replace('/')}
                    className="w-full bg-east-light text-black font-black italic text-xl py-4 rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95"
                >
                    Go Home
                </button>
            </div>
        </div>
    );
}
