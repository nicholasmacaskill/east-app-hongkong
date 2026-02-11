'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';
import { Search, Filter, RefreshCw } from 'lucide-react';

const renderDetailsSummary = (log: any) => {
    const { adminName, targetName } = log.details || {};

    if (log.action === 'UPDATE_PLAYER' || log.action === 'UPDATE_COACH') {
        return `Admin ${adminName || 'Unknown'} updated ${targetName || 'user'}`;
    }

    if (log.action === 'CREATE_PLAYER' || log.action === 'CREATE_COACH') {
        return `Admin ${adminName || 'Unknown'} created ${targetName || 'user'}`;
    }

    if (log.action === 'DELETE_PLAYER' || log.action === 'DELETE_COACH') {
        return `Admin ${adminName || 'Unknown'} deleted ${targetName || 'user'}`;
    }

    if (log.action === 'CREDIT_ADJUSTMENT' || log.action === 'UPDATE_CREDITS') {
        const { amount, newCredits } = log.details || {};
        const verb = amount > 0 ? 'added' : 'removed';
        return `Admin ${adminName || 'Unknown'} ${verb} ${Math.abs(amount)} credits to ${targetName || 'user'} (New: ${newCredits})`;
    }

    if (log.action === 'ANNOUNCEMENT_CREATED' && log.target_type === 'service') {
        return `Admin ${adminName || 'Unknown'} created service: ${targetName || 'Unknown'}`;
    }

    if (log.action === 'ANNOUNCEMENT_UPDATED' && log.target_type === 'service') {
        return `Admin ${adminName || 'Unknown'} updated service: ${targetName || 'Unknown'}`;
    }

    if (log.action === 'ANNOUNCEMENT_DELETED' && log.target_type === 'service') {
        return `Admin ${adminName || 'Unknown'} deleted service: ${targetName || 'Unknown'}`;
    }

    if (log.action === 'CANCEL_BOOKING') {
        const { sessionTitle } = log.details || {};
        return `Admin ${adminName || 'Unknown'} cancelled booking for ${targetName || 'user'} in session: ${sessionTitle || 'Unknown'}`;
    }

    return 'View Details';
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchLogs = async () => {
        setLoading(true);
        let query = supabase
            .from('admin_audit_logs')
            .select(`
                *,
                admin:admin_id (
                    first_name,
                    last_name,
                    contact_email
                )
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (filterAction !== 'ALL') {
            query = query.eq('action', filterAction);
        }

        const { data, error } = await query;
        if (error) console.error('Error fetching logs:', error);

        // Client side filter for search (simpler than complex OR query)
        let filteredData = data || [];
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filteredData = filteredData.filter((log: any) =>
                log.action.toLowerCase().includes(lowerSearch) ||
                log.target_type?.toLowerCase().includes(lowerSearch) ||
                log.admin?.first_name?.toLowerCase().includes(lowerSearch) ||
                log.admin?.last_name?.toLowerCase().includes(lowerSearch) ||
                JSON.stringify(log.details).toLowerCase().includes(lowerSearch)
            );
        }

        setLogs(filteredData);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [filterAction, searchTerm]);

    const uniqueActions = ['ALL', ...Array.from(new Set(logs.map(l => l.action)))].sort();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-[#28D160] pr-1">
                            Audit
                        </span>{' '}
                        Logs
                    </h1>
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">
                        System Tracking & Security Trail
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-3 bg-[#1e1e1e] border border-white/5 rounded-full hover:bg-white/5 transition-all"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin text-[#28D160]' : 'text-gray-400'} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-[#1e1e1e]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#28D160]/50 transition-all font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* <div className="w-48">
                    <select 
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none appearance-none font-mono"
                    >
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div> */}
            </div>

            {/* Logs Table */}
            <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-black">
                                <th className="p-4 w-48">Timestamp</th>
                                <th className="p-4 w-48">Admin</th>
                                <th className="p-4 w-48">Action</th>
                                <th className="p-4 w-32">Target</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-16"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500 italic">No logs found matching your criteria.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-400">
                                            {format(new Date(log.created_at), 'dd MMM yyyy')}<br />
                                            <span className="text-[10px] text-gray-600">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-[8px] font-black text-white">
                                                    {log.admin?.first_name?.[0]}{log.admin?.last_name?.[0]}
                                                </div>
                                                <span className="text-xs font-bold text-gray-300">
                                                    {log.admin?.first_name} {log.admin?.last_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`
                                                inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border
                                                ${getActionStyle(log.action)}
                                            `}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-[10px] text-gray-500">
                                            {log.target_type}<br />
                                            <span className="text-gray-600 truncate max-w-[100px] block" title={log.target_id}>
                                                {log.target_id?.slice(0, 8)}...
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-400">
                                            <details className="cursor-pointer group/details">
                                                <summary className="list-none hover:text-[#28D160] transition-colors flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide">
                                                    <span className="group-open/details:rotate-90 transition-transform">▸</span>
                                                    {renderDetailsSummary(log)}
                                                </summary>
                                                <pre className="mt-2 text-[10px] font-mono bg-black/50 p-2 rounded border border-white/10 overflow-x-auto whitespace-pre-wrap">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
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

function getActionStyle(action: string) {
    if (action.includes('DELETE')) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (action.includes('CREATE')) return 'bg-[#28D160]/10 text-[#28D160] border-[#28D160]/20';
    if (action.includes('UPDATE')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (action.includes('LOGIN')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
}
