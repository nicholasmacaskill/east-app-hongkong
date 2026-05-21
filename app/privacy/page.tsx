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
                        <p className="mb-4">We collect information you provide directly to us, such as when you create an account, update your profile, or make a booking. This includes your name, email, phone number, and any profile photos you upload.</p>
                        <p><strong>Google Workspace / Calendar Data:</strong> If you choose to connect your Google Calendar to our app, we will access your Google Calendar events. We only access the specific data necessary to synchronize your schedule and prevent booking conflicts.</p>
                    </section>
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">2. Use of Information</h2>
                        <p className="mb-4">We use the information we collect to provide, maintain, and improve our services, including to process your bookings and send you related information, such as confirmations and invoices.</p>
                        <p><strong>Google API Disclosure:</strong> Our use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements. We do not use Google user data to serve advertisements or train AI models.</p>
                    </section>
                    <section>
                        <h2 className="text-white font-black italic text-lg mb-3 uppercase tracking-tighter">3. Sharing of Information & Human Access</h2>
                        <p className="mb-4">We do not share your personal data with third parties except as required by law or to provide our services (e.g., sharing your name with a coach when you book a session).</p>
                        <p><strong>No Human Access to Google Data:</strong> We do not allow humans to read your Google Calendar data. Human access is only permitted if we have your explicit consent to investigate a specific technical support issue, if it is necessary for security purposes, or to comply with applicable law.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
