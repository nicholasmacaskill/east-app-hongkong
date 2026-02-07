'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';
import { Search, RefreshCw, Calendar, User, Info, CreditCard } from 'lucide-react';
import { formatHK } from '@/app/lib/dateUtils';

export default function BookingLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/admin/bookings', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) throw new Error('Failed to fetch logs');

            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error('Error fetching booking logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const searchLower = searchTerm.toLowerCase();
        return (
            log.profiles?.first_name?.toLowerCase().includes(searchLower) ||
            log.profiles?.last_name?.toLowerCase().includes(searchLower) ||
            log.sessions?.title?.toLowerCase().includes(searchLower) ||
            log.description?.toLowerCase().includes(searchLower) ||
            log.type?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 pr-1">
                            Booking
                        </span>{' '}
                        Logs
                    </h1>
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">
                        Reservation & Cancellation History
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-3 bg-[#1e1e1e] border border-white/5 rounded-full hover:bg-white/5 transition-all"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin text-yellow-400' : 'text-gray-400'} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-[#1e1e1e]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search by player, session, or description..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-black">
                                <th className="p-4 w-48">Timestamp</th>
                                <th className="p-4 w-64">Player</th>
                                <th className="p-4 w-40">Action</th>
                                <th className="p-4 w-64">Session Context</th>
                                <th className="p-4">Transaction Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-40"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-48"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500 italic">No booking records found.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-400">
                                            {format(new Date(log.created_at), 'dd MMM yyyy')}<br />
                                            <span className="text-[10px] text-gray-600">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:text-white transition-colors">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-200">
                                                        {log.profiles?.first_name} {log.profiles?.last_name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-mono">
                                                        {log.profiles?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`
                                                inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border
                                                ${log.type === 'refund' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}
                                            `}>
                                                {log.type === 'refund' ? 'CANCELLATION' : 'BOOKING'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {log.sessions ? (
                                                <div className="space-y-1">
                                                    <div className="text-xs font-bold text-gray-300 flex items-center gap-1">
                                                        <Info size={10} className="text-gray-600" />
                                                        {log.sessions.title}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {formatHK(log.sessions.start_time, 'EEE, d MMM • h:mm a')}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-600 italic">No session context</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="text-xs text-gray-400 flex-1 min-w-0">
                                                    <p className="truncate" title={log.description}>{log.description}</p>
                                                </div>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 border ${log.amount < 0 ? 'border-red-500/10' : 'border-green-500/10'}`}>
                                                    <CreditCard size={12} className={log.amount < 0 ? 'text-red-500' : 'text-green-500'} />
                                                    <span className={`text-xs font-black italic ${log.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {log.amount > 0 ? '+' : ''}{log.amount} <span className="text-[9px] not-italic opacity-60">CR</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
