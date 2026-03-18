'use client';
import React, { useEffect, useState } from 'react';
import { ClipboardList, Search, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    created_at: string;
    amount: number;
    type: string;
    description: string;
    session_id: number;
    profiles: {
        first_name: string;
        last_name: string;
        email: string;
    } | null;
    sessions: {
        title: string;
        start_time: string;
    } | null;
}

export default function BookingLogPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin-ops/bookings');
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const data = await res.json();
            setTransactions(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sessions?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
                        Booking <span className="text-[#28D160]">Log</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">
                        History of all bookings and cancellations attributed to your admin account.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            className="bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#28D160] transition-colors w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Table/List */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl min-h-[400px] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 border-2 border-[#28D160] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Loading History...</span>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">No booking activity found for your account.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Date & Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Action Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Athlete</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Session Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right whitespace-nowrap">Credits</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((t) => (
                                    <tr key={t.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <p className="text-xs font-bold text-white mb-1">
                                                {format(new Date(t.created_at), 'MMM dd, yyyy')}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">
                                                {format(new Date(t.created_at), 'HH:mm')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                                                t.type === 'booking' ? 'bg-[#28D160]/10 text-[#28D160]' : 'bg-orange-500/10 text-orange-500'
                                            }`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-[#28D160]">
                                                    {t.profiles?.first_name?.[0]}{t.profiles?.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{t.profiles?.first_name} {t.profiles?.last_name}</p>
                                                    <p className="text-[10px] text-gray-500">{t.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs font-bold truncate max-w-[200px]">{t.sessions?.title || 'Unknown Session'}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-tight italic">
                                                {t.description}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <div className={`text-sm font-black italic ${t.amount < 0 ? 'text-white' : 'text-[#28D160]'}`}>
                                                {t.amount > 0 ? '+' : ''}{t.amount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <ChevronRight size={14} className="text-gray-700 group-hover:text-[#28D160] transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
