
'use client';
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CheckCircle, CreditCard, Building } from 'lucide-react';
import Link from 'next/link';
import ClientOnly from '@/app/components/ClientOnly';

export default function QRGenerator() {
    const [activeTab, setActiveTab] = useState<'checkin' | 'payment'>('checkin');

    // Payment State
    const [amount, setAmount] = useState<number>(10);
    const [reason, setReason] = useState<string>('Drop-In Session');

    // Check-In State
    const [location, setLocation] = useState<string>('EAST_HK_MAIN');

    // Generated Payloads
    const checkInPayload = JSON.stringify({
        type: 'check-in',
        location: location,
        timestamp: new Date().toISOString() // Note: Dynamic timestamp means QR changes every render if we aren't careful, but for this demo it's fine.
    });

    const paymentPayload = JSON.stringify({
        type: 'pay',
        amount: amount,
        reason: reason,
        timestamp: new Date().toISOString()
    });

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
            <Link href="/sys-admin" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
            </Link>

            <header className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-[#28D160]">QR Generator</h1>
                <p className="text-gray-400 max-w-xl">
                    Generate active QR codes for gym operations. Print these or display them on a tablet at the front desk.
                </p>
            </header>

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Controls Area */}
                <div className="bg-[#111] p-8 rounded-3xl border border-white/10">

                    {/* Tabs */}
                    <div className="flex p-1 bg-black rounded-xl mb-8 border border-white/10">
                        <button
                            onClick={() => setActiveTab('checkin')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'checkin' ? 'bg-[#28D160] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Building size={16} /> Gym Check-In
                        </button>
                        <button
                            onClick={() => setActiveTab('payment')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'payment' ? 'bg-[#28D160] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <CreditCard size={16} /> Quick Pay
                        </button>
                    </div>

                    {/* Check-In Form */}
                    {activeTab === 'checkin' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Location ID</label>
                                <select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:outline-none focus:border-[#28D160] transition-colors"
                                >
                                    <option value="EAST_HK_MAIN">EAST Hong Kong (Main)</option>
                                    <option value="EAST_KOWLOON">EAST Kowloon</option>
                                    <option value="POP_UP_EVENT">Pop-Up Event</option>
                                </select>
                            </div>

                            <div className="p-4 bg-[#28D160]/10 rounded-xl border border-[#28D160]/20 flex gap-3">
                                <CheckCircle className="text-[#28D160] shrink-0" size={20} />
                                <p className="text-xs text-[#28D160] leading-relaxed">
                                    Users scanning this code will be instantly checked in to <strong>{location}</strong>. A record will be created in the database.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment Form */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amount (Credits)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:outline-none focus:border-[#28D160] transition-colors font-mono text-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reason / Item</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:outline-none focus:border-[#28D160] transition-colors"
                                />
                            </div>

                            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex gap-3">
                                <CreditCard className="text-yellow-500 shrink-0" size={20} />
                                <p className="text-xs text-yellow-500 leading-relaxed">
                                    Users will be prompted to confirm a payment of <strong>{amount} Credits</strong> for "{reason}".
                                </p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Preview Area */}
                <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500 border-4 border-[#28D160]">
                        <ClientOnly>
                            <QRCodeSVG
                                value={activeTab === 'checkin' ? checkInPayload : paymentPayload}
                                size={250}
                                level="H"
                                includeMargin={true}
                            />
                        </ClientOnly>
                    </div>
                    <div className="mt-8 text-center opacity-50">
                        <p className="font-mono text-xs max-w-xs break-all">
                            {activeTab === 'checkin' ? checkInPayload : paymentPayload}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
