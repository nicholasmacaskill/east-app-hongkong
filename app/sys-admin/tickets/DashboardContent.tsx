'use client';
import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Shield, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ChevronRight, 
    ExternalLink, 
    User,
    Check,
    X,
    MoreHorizontal,
    Search,
    Trash2
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import toast from 'react-hot-toast';

type TicketStatus = 'open' | 'in_progress' | 'verify' | 'done' | 'blocked';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface Ticket {
    id: number;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: string;
    reporter_id: string;
    assigned_agent: string;
    test_branch: string;
    test_url: string;
    coo_approval: boolean;
    ceo_approval: boolean;
    cto_approval: boolean;
    screenshot_url: string | null;
    created_at: string;
    updated_at: string;
    reporter: {
        first_name: string;
        last_name: string;
        avatar_url: string;
    } | null;
}

const STATUS_COLUMNS: { id: TicketStatus; label: string; icon: any; color: string }[] = [
    { id: 'open', label: 'Backlog', icon: AlertCircle, color: 'text-gray-400' },
    { id: 'in_progress', label: 'Development', icon: Clock, color: 'text-blue-400' },
    { id: 'verify', label: 'Verify (Test Env)', icon: Shield, color: 'text-orange-400' },
    { id: 'done', label: 'Production / Done', icon: CheckCircle2, color: 'text-[#28D160]' }
];

const PRIORITY_COLORS: Record<TicketPriority, string> = {
    low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
};

export default function DashboardContent() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/admin/tickets');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setTickets(data);
        } catch (error: any) {
            toast.error('Failed to load tickets');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const updateTicket = async (id: number, updates: Partial<Ticket>) => {
        try {
            const res = await fetch('/api/admin/tickets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            if (selectedTicket?.id === id) {
                setSelectedTicket({ ...selectedTicket, ...updates });
            }
            toast.success('Ticket updated');
        } catch (error: any) {
            toast.error('Update failed');
        }
    };

    const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const form = e.currentTarget;
        setIsSubmitting(true);
        console.log('[TICKET_CREATE] Starting submission...');
        
        try {
            // Check auth first
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                console.error('[TICKET_CREATE] Auth check failed:', authError);
                throw new Error('You are not properly authenticated. Please LOG OUT and log back in with your permanent admin credentials.');
            }

            console.log('[TICKET_CREATE] Authenticated as:', user.email);

            // Use the form element directly to build FormData
            const formData = new FormData(form);
            formData.append('reporter_id', user.id);
            
            if (screenshotFile) {
                formData.append('screenshot', screenshotFile);
            }

            console.log('[TICKET_CREATE] Sending request to /api/admin/tickets...');
            
            const res = await fetch('/api/admin/tickets', {
                method: 'POST',
                body: formData
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.error || `Server error (${res.status}): Please contact engineering.`);
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            console.log('[TICKET_CREATE] Success! Ticket ID:', data.id);
            toast.success('Ticket created successfully', {
                position: 'bottom-right',
                duration: 4000
            });
            
            setIsCreateModalOpen(false);
            setScreenshotFile(null);
            setScreenshotPreview(null);
            fetchTickets();
        } catch (error: any) {
            console.error('[TICKET_CREATE_FAILURE]', error);
            // Fallback alert if toast fails or is invisible
            alert(`Error: ${error.message}`);
            toast.error(error.message || 'Failed to create ticket', {
                position: 'bottom-right',
                duration: 6000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTicket = async (id: number) => {
        if (!window.confirm('Are you sure you want to permanently delete this ticket?')) return;
        
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/tickets?id=${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.error || `Server responded with ${res.status}`);
            }

            toast.success('Ticket deleted successfully');
            setSelectedTicket(null);
            fetchTickets();
        } catch (error: any) {
            console.error('[TICKET_DELETE_FAILURE]', error);
            toast.error(error.message || 'Failed to delete ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTickets = tickets.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toString() === searchQuery.replace('#', '')
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-[#28D160] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                        Engineering <ChevronRight size={10} /> Issue Dashboard
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Shield className="text-[#28D160]" size={32} />
                        EAST JIRA-LITE
                    </h1>
                    <p className="text-gray-400">Agentic Bug Tracking & Verification Control</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text"
                            placeholder="Search #ticket or title..."
                            className="bg-[#1e1e1e] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#28D160] transition-colors w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-[#28D160] text-black px-6 py-2.5 rounded-full font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:bg-white transition-colors"
                    >
                        <Plus size={18} strokeWidth={3} /> Report Bug
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {STATUS_COLUMNS.map(col => (
                    <div key={col.id} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <col.icon className={col.color} size={16} />
                                <h3 className="font-black uppercase italic text-xs tracking-widest text-gray-400">{col.label}</h3>
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                                {filteredTickets.filter(t => t.status === col.id).length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 min-h-[500px] bg-white/[0.02] rounded-3xl p-3 border border-dashed border-white/5">
                            {filteredTickets
                                .filter(t => t.status === col.id)
                                .map(ticket => (
                                    <div 
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="bg-[#1e1e1e] p-4 rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all group relative overflow-hidden active:scale-95"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${PRIORITY_COLORS[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                            <span className="text-[10px] text-gray-600 font-bold tracking-tighter">#{ticket.id}</span>
                                        </div>

                                        <h4 className="font-bold text-sm mb-3 group-hover:text-[#28D160] transition-colors line-clamp-2">{ticket.title}</h4>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-400 overflow-hidden font-black">
                                                    {ticket.reporter?.avatar_url ? (
                                                        <img src={ticket.reporter.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        ticket.reporter?.first_name?.[0] || '?'
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold italic truncate max-w-[80px]">
                                                    {ticket.reporter?.first_name || 'System'}
                                                </span>
                                            </div>
                                            <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        
                                        {/* Status specific indicators */}
                                        {ticket.coo_approval && ticket.ceo_approval && ticket.cto_approval && (
                                            <div className="absolute top-0 right-0 p-1">
                                                <div className="bg-[#28D160]/20 text-[#28D160] rounded-bl-xl p-1">
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            
                            {filteredTickets.filter(t => t.status === col.id).length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 italic text-[10px] py-20 pointer-events-none">
                                    No tickets in this lane
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedTicket(null)} />
                    <div className="relative bg-[#1e1e1e] w-full max-w-2xl rounded-3xl border border-white/10 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/5 flex items-start justify-between bg-gradient-to-r from-transparent to-white/[0.02]">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs text-gray-500 font-black tracking-widest uppercase">Ticket #{selectedTicket.id}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                                        {selectedTicket.priority}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">{selectedTicket.title}</h2>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                            {/* Screenshot */}
                            {selectedTicket.screenshot_url && (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#28D160]">Screenshot</h3>
                                    <a 
                                        href={selectedTicket.screenshot_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-[#28D160]/50 transition-colors"
                                    >
                                        <img 
                                            src={selectedTicket.screenshot_url} 
                                            alt="Bug screenshot" 
                                            className="max-h-48 w-auto mx-auto rounded-lg"
                                        />
                                        <p className="text-center text-[10px] text-gray-500 mt-2">Click to view full size</p>
                                    </a>
                                </div>
                            )}

                            {/* Description */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#28D160]">Summary & Context</h3>
                                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedTicket.description || 'No description provided.'}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Assigned Agent</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-[#28D160]/20 flex items-center justify-center text-[#28D160]">
                                            <Shield size={14} />
                                        </div>
                                        <span className="text-sm font-bold italic">{selectedTicket.assigned_agent}</span>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Category</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold uppercase tracking-tighter text-gray-300">{selectedTicket.category}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sandbox & Verification */}
                            {(selectedTicket.status === 'verify' || selectedTicket.status === 'in_progress') && (
                                <div className="bg-orange-500/5 p-6 rounded-2xl border border-orange-500/20 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                                            <Shield size={16} /> Sandbox Verification
                                        </h3>
                                        {selectedTicket.test_url && (
                                            <a 
                                                href={selectedTicket.test_url} 
                                                target="_blank" 
                                                className="text-[10px] font-black uppercase bg-orange-400 text-black px-3 py-1 rounded-full flex items-center gap-1 hover:bg-white transition-colors"
                                            >
                                                Open Sandbox <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Target Branch</span>
                                        <code className="text-xs text-orange-200 bg-orange-500/10 p-2 rounded-lg border border-orange-500/10">
                                            {selectedTicket.test_branch || 'test'}
                                        </code>
                                    </div>
                                </div>
                            )}

                            {/* Approval Gates */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#28D160]">Executive Approval Gate</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div 
                                        onClick={() => updateTicket(selectedTicket.id, { coo_approval: !selectedTicket.coo_approval })}
                                        className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${selectedTicket.coo_approval ? 'bg-[#28D160]/10 border-[#28D160]/40' : 'bg-white/[0.02] border-white/5 opacity-50'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase italic tracking-tighter">COO Approval</span>
                                            {selectedTicket.coo_approval ? <CheckCircle2 className="text-[#28D160]" size={18} /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                                        </div>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Fiona</p>
                                    </div>

                                    <div 
                                        onClick={() => updateTicket(selectedTicket.id, { ceo_approval: !selectedTicket.ceo_approval })}
                                        className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${selectedTicket.ceo_approval ? 'bg-[#28D160]/10 border-[#28D160]/40' : 'bg-white/[0.02] border-white/5 opacity-50'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase italic tracking-tighter">CEO Approval</span>
                                            {selectedTicket.ceo_approval ? <CheckCircle2 className="text-[#28D160]" size={18} /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                                        </div>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Ben</p>
                                    </div>

                                    <div 
                                        onClick={() => updateTicket(selectedTicket.id, { cto_approval: !selectedTicket.cto_approval })}
                                        className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${selectedTicket.cto_approval ? 'bg-[#28D160]/10 border-[#28D160]/40' : 'bg-white/[0.02] border-white/5 opacity-50'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase italic tracking-tighter">CTO Approval</span>
                                            {selectedTicket.cto_approval ? <CheckCircle2 className="text-[#28D160]" size={18} /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                                        </div>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Nic</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer / Actions */}
                        <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Change State:</span>
                                <div className="flex bg-black p-1 rounded-xl">
                                    {['open', 'in_progress', 'verify', 'done'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => updateTicket(selectedTicket.id, { status: s as TicketStatus })}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${selectedTicket.status === s ? 'bg-white/10 text-white shadow-xl' : 'text-gray-600 hover:text-gray-400'}`}
                                        >
                                            {s.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => selectedTicket && handleDeleteTicket(selectedTicket.id)}
                                disabled={isSubmitting}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-full font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                                <Trash2 size={18} /> Delete Ticket
                            </button>

                            {selectedTicket.status === 'verify' && selectedTicket.coo_approval && selectedTicket.ceo_approval && selectedTicket.cto_approval && (
                                <button 
                                    onClick={() => updateTicket(selectedTicket.id, { status: 'done' })}
                                    className="bg-[#28D160] text-black px-6 py-2.5 rounded-full font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                                >
                                    Promote to Production <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)} />
                    <form onSubmit={handleCreateTicket} className="relative bg-[#1e1e1e] w-full max-w-lg rounded-3xl border border-white/10 shadow-3xl overflow-hidden p-8 flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">Report Bug</h2>
                            <p className="text-gray-500 text-xs">This ticket will be assigned to the Engineering Agent.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Summary</label>
                            <input 
                                name="title" 
                                required
                                placeholder="Short description of the bug..."
                                className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#28D160] transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Reproduction Steps / Details</label>
                            <textarea 
                                name="description"
                                rows={4}
                                placeholder="What happened? What was expected?"
                                className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#28D160] transition-colors resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Screenshot (Optional)</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setScreenshotFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setScreenshotPreview(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                    id="screenshot-upload"
                                />
                                <label
                                    htmlFor="screenshot-upload"
                                    className="flex items-center justify-center gap-2 bg-black/40 border border-white/5 border-dashed rounded-2xl px-5 py-4 cursor-pointer hover:border-[#28D160] transition-colors"
                                >
                                    {screenshotPreview ? (
                                        <img src={screenshotPreview} alt="Preview" className="h-20 object-contain rounded" />
                                    ) : (
                                        <>
                                            <Plus size={20} className="text-gray-500" />
                                            <span className="text-sm text-gray-500">Click to upload screenshot</span>
                                        </>
                                    )}
                                </label>
                                {screenshotPreview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScreenshotFile(null);
                                            setScreenshotPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Priority</label>
                                <select name="priority" className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#28D160] transition-colors appearance-none font-bold italic uppercase tracking-tighter">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2 pt-6">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-[#28D160] text-black h-full rounded-2xl font-black uppercase italic tracking-tighter text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Ticket'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
