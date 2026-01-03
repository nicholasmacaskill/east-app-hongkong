import React from 'react';
import Link from 'next/link';
import { Users, Calendar, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Dashboard</h1>
                <p className="text-gray-400 max-w-2xl">
                    Welcome to the EAST management console. Use the tabs below to manage players, teams, and coach schedules.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player Management Card */}
                <Link href="/sys-admin/players" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Users size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Manage Players</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Add new players, initialie profiles, generate QR codes, and update team rosters.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Player Manager <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Schedule Management Card */}
                <Link href="/sys-admin/schedule" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calendar size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Calendar size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Manage Schedules</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Set availability for coaches, manage recurring time blocks, and update schedule photos.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Schedule Manager <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Coach Management Card */}
                <Link href="/sys-admin/coaches" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Users size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Manage Coaches</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Add new coaches, manage profiles, and update contact information.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Coach Manager <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* QR Generator Card */}
                <Link href="/sys-admin/qr" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="120"
                                height="120"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-qr-code"
                            >
                                <rect width="5" height="5" x="3" y="3" /><rect width="5" height="5" x="16" y="3" /><rect width="5" height="5" x="3" y="16" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
                            </svg>
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-qr-code"
                                >
                                    <rect width="5" height="5" x="3" y="3" /><rect width="5" height="5" x="16" y="3" /><rect width="5" height="5" x="3" y="16" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">QR Generator</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Create active QR codes for Check-Ins and Quick Payments.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Generator <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
