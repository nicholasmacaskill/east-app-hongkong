import React from 'react';
import Link from 'next/link';
import { Users, Calendar, ArrowRight, QrCode } from 'lucide-react';

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
                                    Add/Edit coach profiles, contact info, and manage their individual availability rules.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                View Coach List <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Master Schedule Card */}
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
                                <h2 className="text-xl font-black italic uppercase mb-2">Master Schedule</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    View the global facility timeline, manage sessions, and see resource allocation.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Master GRID <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* QR Generator Card */}
                <Link href="/sys-admin/qr" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <QrCode size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <QrCode size={24} />
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
