'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Plus, Edit2, Trash2, Package, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type ShopItem = {
    id: number;
    name: string;
    price_credits: number;
    category: string;
    active: boolean;
    created_at: string;
};

const CATEGORIES = ['drinks', 'snacks', 'merch', 'equipment', 'general'];

export default function ShopManagementPage() {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [allItems, setAllItems] = useState<ShopItem[]>([]); // includes inactive
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        price_credits: '',
        category: 'general',
    });

    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token;
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const token = await getToken();

            // Fetch active items via API
            const res = await fetch('/api/admin/shop-items', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);

            // Also fetch inactive items directly for the "show inactive" toggle
            // (service_role bypasses RLS — but on client we need to go via supabase admin)
            // We'll just show what the API returns (active=true) and toggle via PUT
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = await getToken();
            const payload = {
                name: formData.name,
                price_credits: Number(formData.price_credits),
                category: formData.category,
                ...(editingItem ? { id: editingItem.id } : {}),
            };

            const res = await fetch('/api/admin/shop-items', {
                method: editingItem ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to save'); return; }

            setShowModal(false);
            setEditingItem(null);
            setFormData({ name: '', price_credits: '', category: 'general' });
            fetchItems();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = await getToken();
            const res = await fetch(`/api/admin/shop-items?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { setConfirmDeleteId(null); fetchItems(); }
        } catch (e) { console.error(e); }
    };

    const openEdit = (item: ShopItem) => {
        setEditingItem(item);
        setFormData({ name: item.name, price_credits: String(item.price_credits), category: item.category });
        setShowModal(true);
    };

    const openNew = () => {
        setEditingItem(null);
        setFormData({ name: '', price_credits: '', category: 'general' });
        setShowModal(true);
    };

    const categoryColor: Record<string, string> = {
        drinks: 'bg-blue-500/20 text-blue-400',
        snacks: 'bg-yellow-500/20 text-yellow-400',
        merch: 'bg-purple-500/20 text-purple-400',
        equipment: 'bg-orange-500/20 text-orange-400',
        general: 'bg-gray-500/20 text-gray-400',
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <Link href="/sys-admin" className="self-start text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-white mb-4 block transition-colors">
                    ← Back to Dashboard
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Shop Items</h1>
                        <p className="text-gray-400 mt-1">
                            Manage items available for credit deduction at the front desk.
                            These items appear on the QR scanner when charging a member.
                        </p>
                    </div>
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 bg-[#28D160] text-black px-4 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-lg flex-shrink-0"
                    >
                        <Plus size={14} /> Add Item
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active Items', value: items.length },
                    { label: 'Categories', value: [...new Set(items.map(i => i.category))].length },
                    { label: 'Lowest Price', value: items.length ? `${Math.min(...items.map(i => i.price_credits))} cr` : '—' },
                    { label: 'Highest Price', value: items.length ? `${Math.max(...items.map(i => i.price_credits))} cr` : '—' },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#1e1e1e] rounded-2xl border border-white/5 p-5">
                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{stat.label}</div>
                        <div className="text-2xl font-black italic text-white">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Items grid */}
            {loading ? (
                <div className="text-center py-16 text-gray-500 text-sm">Loading items...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 bg-[#1e1e1e] rounded-2xl border border-white/5">
                    <Package size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">No active items yet.</p>
                    <button onClick={openNew} className="mt-4 text-[#28D160] text-xs font-bold uppercase tracking-widest hover:underline">
                        + Add your first item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-[#1e1e1e] rounded-2xl border border-white/5 p-6 flex flex-col gap-4 group hover:border-white/10 transition-colors">
                            <div className="flex items-start justify-between">
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-widest ${categoryColor[item.category] || categoryColor.general}`}>
                                    {item.category}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDeleteId(item.id)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-white text-base">{item.name}</h3>
                            </div>

                            <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Price</div>
                                    <div className="font-montserrat font-black italic text-[#28D160] text-2xl">
                                        {item.price_credits}
                                        <span className="text-xs text-gray-500 ml-1 not-italic font-bold">cr</span>
                                    </div>
                                </div>

                                {confirmDeleteId === item.id ? (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-gray-500">Remove?</span>
                                        <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg">Yes</button>
                                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/5 text-white text-xs font-bold rounded-lg">No</button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e1e1e] rounded-2xl border border-white/10 p-8 w-full max-w-md">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6">
                            {editingItem ? 'Edit Item' : 'New Item'}
                        </h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Infusion - Salty Berry"
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Price (Credits)</label>
                                <input
                                    type="number"
                                    value={formData.price_credits}
                                    onChange={e => setFormData({ ...formData, price_credits: e.target.value })}
                                    placeholder="16"
                                    min={1}
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#28D160] outline-none transition-all"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
                            )}

                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setError(null); }}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-[#28D160] hover:bg-white text-black px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
