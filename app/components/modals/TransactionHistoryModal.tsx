import React, { useState, useEffect } from 'react';
import { X, Clock, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

interface Transaction {
    id: string;
    created_at: string;
    amount: number;
    type: string;
    description: string;
    stripe_session_id?: string;
}

interface TransactionHistoryModalProps {
    onClose: () => void;
}

export default function TransactionHistoryModal({ onClose }: TransactionHistoryModalProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch('/api/user/transactions', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setTransactions(data.transactions);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] p-6 rounded-[2rem] w-full max-w-md border border-white/10 relative shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-start justify-between mb-6 px-2 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-east-light/10 flex items-center justify-center text-east-light border border-east-light/20 shrink-0">
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h2 className="font-black italic text-xl uppercase text-white leading-none">Transaction History</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Your recent activity</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-all shadow-lg active:scale-95 shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-east-light border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock size={32} className="text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 font-bold uppercase text-xs">No transactions found</p>
                        </div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${tx.amount > 0 ? 'bg-east-light/10 border-east-light/20 text-east-light' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                        }`}>
                                        {tx.amount > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{tx.description || tx.type.toUpperCase()}</p>
                                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">{formatDate(tx.created_at)}</p>
                                    </div>
                                </div>
                                <div className={`font-mono font-black italic text-lg ${tx.amount > 0 ? 'text-east-light' : 'text-white'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">East Sports HK</p>
                </div>
            </div>
        </div>
    );
}
