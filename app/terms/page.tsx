'use client';
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white font-montserrat p-6 pb-24 animate-fadeIn">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-10 pt-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={28} />
                    </Link>
                    <h1 className="text-2xl font-black italic uppercase tracking-tight">Terms & Conditions</h1>
                </div>

                <div className="space-y-8 text-gray-400 font-opensans text-sm leading-relaxed">
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">1. Acceptance of Terms</h2>
                        <p>By accessing or using the EAST App, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>
                    </section>
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">2. User Accounts</h2>
                        <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your devices. You agree to accept responsibility for all activities that occur under your account.</p>
                    </section>
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">3. Booking & Cancellations</h2>
                        <p>Bookings are subject to availability. Cancellations must be made within the specified time frame to receive a credit refund. EAST Sports Group reserves the right to cancel or reschedule sessions at any time.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
