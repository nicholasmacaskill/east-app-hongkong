'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Calendar, ArrowRight, QrCode, LayoutGrid, Coins, Shield, Trophy, CreditCard } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    return (
        <div className="flex flex-col gap-8 pb-20">
            <div className="flex flex-col gap-2">
                <Link href="/" className="self-start text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-white mb-4 block transition-colors">← Back to App</Link>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Dashboard</h1>
                <p className="text-gray-400 max-w-2xl">
                    Welcome to the EAST management console. Use the tabs below to manage players, teams, and coach schedules.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unified People Directory Card */}
                <Link href="/sys-admin/directory" className="group col-span-1 md:col-span-2">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Users size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">People Directory - Add players, coaches or parents</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Centralized management for the entire EAST community. Add coaches, initialize family profiles, top up credits, and manage team rosters from one place.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Unified Directory <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Manage Services */}
                <div onClick={() => router.push('/sys-admin/services')} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 hover:border-[#28D160] transition-colors cursor-pointer group relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutGrid size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                            <LayoutGrid size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic uppercase mb-2">Manage Services</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">Add/Edit Class & Private Lesson Types</p>
                        </div>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                            Open Service Manager <ArrowRight size={14} />
                        </div>
                    </div>
                </div>

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

                {/* Check-In Scanner Card */}
                <Link href="/check-in" className="group">
                    <div className="bg-[#1e1e1e] border border-[#28D160]/30 rounded-2xl p-6 hover:bg-[#28D160]/5 transition-colors relative overflow-hidden h-full shadow-[0_0_15px_rgba(40,209,96,0.1)]">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                            <QrCode size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160] flex items-center justify-center text-black">
                                <QrCode size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2 text-[#28D160]">Launch Scanner</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Open the camera to scan athlete wallets for facility entry or to charge their account directly.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-black uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Camera <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* News Management Card */}
                <Link href="/sys-admin/news" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calendar size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Calendar size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Manage News</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Publish breaking news, announcements, and updates to the Home Screen.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open News Editor <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Stripe Connect */}
                <Link href="/sys-admin/payments" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CreditCard size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <CreditCard size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Connect Payments</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Link your organization&apos;s Stripe account when you&apos;re ready to accept memberships and top-ups.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Open Payments Setup <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Financial Oversight Card */}
                <Link href="/sys-admin/transactions" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Coins size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Coins size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Financial Oversight</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Global transaction log. Monitor credits, memberships, and manual adjustments.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                View Transactions <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Stats Management Card */}
                <Link href="/sys-admin/stats" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Trophy size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Stats Management</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Manage player stats for Golf, HYROX, Hockey, EAGL, and Fitness Test. Enter stats that appear on the public leaderboard.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                Manage Stats <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Key Metrics Dashboard Card */}
                <Link href="/sys-admin/metrics" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Key Metrics</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Track subscribers, retention, bookings revenue, facility usage, and cancellations.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                View Dashboard <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Audit Logs Card */}
                <Link href="/sys-admin/audit" className="group">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 hover:border-[#28D160] transition-colors relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shield size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                <Shield size={24} />
                            </div>

                            <div>
                                <h2 className="text-xl font-black italic uppercase mb-2">Audit Logs</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    System Tracking & Security Trail. Monitor admin actions and security logs.
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-[#28D160] text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                View Audit Trail <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Bug Tracker Card */}
                <Link href="/sys-admin/tickets" className="group col-span-1 md:col-span-2">
                    <div className="bg-gradient-to-br from-[#1e1e1e] to-[#252525] rounded-2xl p-8 border border-white/5 hover:border-[#28D160] transition-all relative overflow-hidden h-full shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                            <Shield size={160} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-[#28D160]/20 flex items-center justify-center text-[#28D160] shadow-inner">
                                <Shield size={32} />
                            </div>

                            <div className="max-w-xl">
                                <h2 className="text-2xl font-black italic uppercase mb-3 tracking-tighter">Issue Dashboard & Bug Tracker</h2>
                                <p className="text-gray-400 text-base leading-relaxed">
                                    Track engineering tickets, submit bug reports, and verify fixes on the sandbox environment. Centralized hub for COO/CEO verification gates.
                                </p>
                            </div>

                            <div className="mt-auto pt-6 flex items-center gap-3 text-[#28D160] text-sm font-black uppercase tracking-widest group-hover:text-white transition-all transform group-hover:translate-x-1">
                                Open Jira-Lite Dashboard <ArrowRight size={18} />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

        </div>
    );
}
