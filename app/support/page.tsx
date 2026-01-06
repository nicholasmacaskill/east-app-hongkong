'use client';
import React from 'react';
import { ChevronLeft, Mail, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-black text-white font-montserrat p-6 pb-24 animate-fadeIn">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-10 pt-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={28} />
                    </Link>
                    <h1 className="text-2xl font-black italic uppercase tracking-tight">Support</h1>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <h2 className="text-east-light font-black italic text-lg mb-4 uppercase">Direct Contact</h2>
                        <div className="space-y-4">
                            <a href="mailto:easthpc@gmail.com" className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/10">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Email Us</p>
                                    <p className="font-bold">easthpc@gmail.com</p>
                                </div>
                            </a>
                            <a href="tel:+85294327841" className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/10">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Call Us</p>
                                    <p className="font-bold">+852 9432 7841</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <h2 className="text-east-light font-black italic text-lg mb-4 uppercase">In-App Help</h2>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">Our team is available 24/7 to help you with any technical issues or booking inquiries.</p>
                        <a
                            href="https://wa.link/hzsade"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-east-light text-black font-black italic py-4 rounded-full uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={18} />
                            Start Live Chat
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
