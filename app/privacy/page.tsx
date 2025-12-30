'use client';
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white font-montserrat p-6 pb-24 animate-fadeIn">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-10 pt-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={28} />
                    </Link>
                    <h1 className="text-2xl font-black italic uppercase tracking-tight">Privacy Policy</h1>
                </div>

                <div className="space-y-8 text-gray-400 font-opensans text-sm leading-relaxed">
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">1. Data Collection</h2>
                        <p>We collect information you provide directly to us, such as when you create an account, update your profile, or make a booking. This includes your name, email, phone number, and any profile photos you upload.</p>
                    </section>
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">2. Use of Information</h2>
                        <p>We use the information we collect to provide, maintain, and improve our services, including to process your bookings and send you related information, such as confirmations and invoices.</p>
                    </section>
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">3. Sharing of Information</h2>
                        <p>We do not share your personal data with third parties except as required by law or to provide our services (e.g., sharing your name with a coach when you book a session).</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
