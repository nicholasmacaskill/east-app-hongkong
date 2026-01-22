'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, Newspaper, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type Announcement = {
    id: string;
    title: string;
    content: string;
    type: 'news' | 'event';
    published: boolean;
    event_date?: string;
    image_url?: string;
    created_at: string;
    updated_at: string;
};

export default function NewsManagementPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'news' | 'event'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'news' as 'news' | 'event',
        published: false,
        event_date: '',
        image_url: ''
    });

    useEffect(() => {
        fetchAnnouncements();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) fetchAnnouncements(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchAnnouncements = async (passedSession?: any) => {
        setLoading(true);
        try {
            const session = passedSession || (await supabase.auth.getSession()).data.session;
            if (!session) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/admin/announcements', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                cache: 'no-store'
            });
            const data = await response.json();
            if (response.ok) {
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const method = editingItem ? 'PUT' : 'POST';
            const body = editingItem
                ? { ...formData, id: editingItem.id }
                : formData;

            const response = await fetch('/api/admin/announcements', {
                method,
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setShowModal(false);
                setEditingItem(null);
                setFormData({
                    title: '',
                    content: '',
                    type: 'news',
                    published: false,
                    event_date: '',
                    image_url: ''
                });
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/admin/announcements?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const togglePublished = async (item: Announcement) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/admin/announcements', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...item,
                    published: !item.published
                })
            });

            if (response.ok) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const openEditModal = (item: Announcement) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            type: item.type,
            published: item.published,
            event_date: item.event_date ? new Date(item.event_date).toISOString().split('T')[0] : '',
            image_url: item.image_url || ''
        });
        setShowModal(true);
    };

    const filtered = announcements.filter(a => filter === 'all' || a.type === filter);

    return (
        <div className="flex flex-col gap-8 pb-20">
            <div className="flex flex-col gap-2">
                <Link href="/sys-admin" className="self-start text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-white mb-4 block transition-colors">← Back to Dashboard</Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">News Management</h1>
                        <p className="text-gray-400 max-w-2xl">
                            Create and manage news announcements and events for the public landing page.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({
                                title: '',
                                content: '',
                                type: 'news',
                                published: false,
                                event_date: '',
                                image_url: ''
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-[#28D160] text-black px-4 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-lg"
                    >
                        <Plus size={14} /> Add Announcement
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'news', 'event'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filter === tab
                            ? 'bg-[#28D160] text-black'
                            : 'bg-[#1e1e1e] text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">No announcements found</div>
                ) : (
                    filtered.map(item => (
                        <div key={item.id} className="bg-[#1e1e1e] rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {item.type === 'news' ? (
                                        <Newspaper size={16} className="text-[#28D160]" />
                                    ) : (
                                        <Calendar size={16} className="text-blue-400" />
                                    )}
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${item.type === 'news'
                                        ? 'bg-[#28D160]/20 text-[#28D160]'
                                        : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {item.type}
                                    </span>
                                </div>
                                <button
                                    onClick={() => togglePublished(item)}
                                    className={`p-1 rounded ${item.published ? 'text-[#28D160]' : 'text-gray-500'}`}
                                    title={item.published ? 'Published' : 'Draft'}
                                >
                                    {item.published ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>

                            <div>
                                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-3">{item.content}</p>
                            </div>

                            {item.type === 'event' && item.event_date && (
                                <div className="text-xs text-gray-500">
                                    📅 {new Date(item.event_date).toLocaleDateString()}
                                </div>
                            )}

                            <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                    <Edit2 size={12} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e1e1e] rounded-2xl border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6">
                            {editingItem ? 'Edit Announcement' : 'New Announcement'}
                        </h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'news' | 'event' })}
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all"
                                    required
                                >
                                    <option value="news">News</option>
                                    <option value="event">Event</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter headline..."
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Write your story..."
                                    rows={6}
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all resize-none"
                                    required
                                />
                            </div>

                            {formData.type === 'event' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Event Date</label>
                                    <input
                                        type="date"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Image URL (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="published"
                                    checked={formData.published}
                                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="published" className="text-sm text-gray-300">Publish immediately</label>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#28D160] hover:bg-white text-black px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                                >
                                    {editingItem ? 'Update' : 'Save Story'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
