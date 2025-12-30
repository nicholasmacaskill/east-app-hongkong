'use client';
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const StaticPage = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="min-h-screen bg-black text-white font-montserrat p-6 pb-24 animate-fadeIn">
        <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-10 pt-4">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={28} />
                </Link>
                <h1 className="text-2xl font-black italic uppercase tracking-tight">{title}</h1>
            </div>
            <div className="space-y-8 text-gray-400 font-opensans text-sm leading-relaxed">
                {children}
            </div>
        </div>
    </div>
);

export default function FAQPage() {
    return (
        <StaticPage title="FAQ's">
            <section>
                <h2 className="text-east-light font-black italic text-lg mb-2 uppercase">How do I book a session?</h2>
                <p>Navigate to the Home screen, select a category (Classes, Private Lessons, etc.), choose your preferred time slot, and click "PAY WITH CREDITS".</p>
            </section>
            <section>
                <h2 className="text-east-light font-black italic text-lg mb-2 uppercase">How do I top up credits?</h2>
                <p>Go to your Wallet (QR) screen and tap the "TOP UP CREDITS" button. You can also do this directly from the booking modal if your balance is low.</p>
            </section>
            <section>
                <h2 className="text-east-light font-black italic text-lg mb-2 uppercase">Can I cancel a booking?</h2>
                <p>Yes, open the session from your schedule or the original booking screen and tap "CANCEL BOOKING". Credits will be refunded to your account instantly.</p>
            </section>
        </StaticPage>
    );
}
