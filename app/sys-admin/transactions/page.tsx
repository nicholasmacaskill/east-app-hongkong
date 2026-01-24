'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ArrowLeft, Search, Coins, Calendar, User, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { safetoLocaleDateString } from '@/app/lib/dateUtils';

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/admin/transactions', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setTransactions(data);
            } else {
                console.error('Error fetching transactions:', data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const filtered = transactions.filter(t =>
        (t.profiles?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.profiles?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.type || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 w-full overflow-x-hidden">
            <div className="flex flex-col gap-2">
                <Link href="/sys-admin" className="self-start text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-white mb-4 block transition-colors">← Back to Dashboard</Link>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Financial Oversight</h1>
                        <p className="text-gray-400 max-w-2xl">
                            Global transaction log. Monitor credits, memberships, and manual adjustments.
                        </p>
                    </div>
                    <button
                        onClick={() => {/* CSV Export logic */ }}
                        className="flex items-center gap-2 bg-[#28D160] text-black px-4 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-lg"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, type, or description..."
                            className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#28D160] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-black/50 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 animate-pulse">
                                        Loading transaction data...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            ) : filtered.map((t) => (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 text-xs text-gray-400">
                                        {safetoLocaleDateString(t.created_at, undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-[#28D160] transition-colors">
                                                {t.profiles?.first_name} {t.profiles?.last_name}
                                            </span>
                                            <span className="text-[10px] text-gray-500 uppercase">{t.profiles?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${t.type === 'membership' ? 'bg-blue-500/20 text-blue-400' :
                                            t.type === 'manual' ? 'bg-purple-500/20 text-purple-400' :
                                                t.type === 'refund' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-green-500/20 text-green-400'
                                            }`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-bold italic text-[#28D160]">
                                            <Coins size={14} />
                                            {t.amount > 0 ? `+${t.amount}` : t.amount}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 max-w-sm">
                                        {t.description || '-'}
                                        {t.stripe_session_id && (
                                            <div className="text-[9px] opacity-50 mt-1 font-mono">ID: {t.stripe_session_id}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
