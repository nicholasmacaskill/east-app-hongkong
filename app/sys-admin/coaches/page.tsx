'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Search, Trash2, Edit2, Shield } from 'lucide-react'; // Removed QrCode import locally
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/app/lib/supabase';

export default function CoachManagement() {
    const [coaches, setCoaches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Add Coach Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCoach, setNewCoach] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        bio: ''
    });

    useEffect(() => {
        fetchCoaches();
    }, []);

    const fetchCoaches = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'coach')
            .order('created_at', { ascending: false });

        if (data) {
            setCoaches(data);
        }
        setLoading(false);
    };

    const handleAddCoach = async () => {
        if (!newCoach.first_name || !newCoach.last_name || !newCoach.email) return alert("Please fill required fields (Name, Email)");

        try {
            const response = await fetch('/api/admin/create-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newCoach.email,
                    password: 'password123', // Default temporary password
                    firstName: newCoach.first_name,
                    lastName: newCoach.last_name,
                    mobile: newCoach.mobile,
                    bio: newCoach.bio
                })
            });

            const result = await response.json();

            if (!result.success) {
                alert('Error adding coach: ' + result.error);
            } else {
                alert('Coach added successfully. Default password is "password123".');
                setShowAddForm(false);
                setNewCoach({ first_name: '', last_name: '', email: '', mobile: '', bio: '' });
                fetchCoaches();
            }
        } catch (err) {
            alert('Failed to connect to server.');
            console.error(err);
        }
    };

    const filteredCoaches = coaches.filter(c =>
    (c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sys-admin" className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-[#28D160] hover:text-black transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Coaches</h1>
                        <p className="text-gray-400 text-xs">Manage coach profiles & details</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-[#28D160] text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-2 uppercase tracking-wide"
                >
                    <Plus size={16} /> Add Coach
                </button>
            </div>

            {/* Add Coach Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10">
                        <h2 className="font-black italic text-xl uppercase mb-4">Add New Coach</h2>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name *</label>
                                    <input
                                        value={newCoach.first_name}
                                        onChange={e => setNewCoach({ ...newCoach, first_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name *</label>
                                    <input
                                        value={newCoach.last_name}
                                        onChange={e => setNewCoach({ ...newCoach, last_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Email *</label>
                                <input
                                    value={newCoach.email}
                                    onChange={e => setNewCoach({ ...newCoach, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                                <input
                                    value={newCoach.mobile}
                                    onChange={e => setNewCoach({ ...newCoach, mobile: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Bio</label>
                                <textarea
                                    value={newCoach.bio}
                                    onChange={e => setNewCoach({ ...newCoach, bio: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleAddCoach} className="flex-1 bg-[#28D160] text-black font-bold py-2 rounded uppercase text-xs hover:bg-white">Save Coach</button>
                                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-white/10 text-white font-bold py-2 rounded uppercase text-xs hover:bg-white/20">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    type="text"
                    placeholder="Search coaches..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/5 pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#28D160]"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Loading coaches...</div>
                ) : filteredCoaches.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">No coaches found.</div>
                ) : (
                    filteredCoaches.map(coach => (
                        <div key={coach.id} className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/5 group hover:border-[#28D160]/50 transition-colors p-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-white text-lg">{coach.first_name} {coach.last_name}</h3>
                                    <span className="text-[10px] bg-[#28D160]/20 text-[#28D160] px-2 py-0.5 rounded uppercase">
                                        Coach
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs">{coach.contact_email}</p>
                                {coach.mobile && <p className="text-gray-500 text-xs">{coach.mobile}</p>}
                                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{coach.bio || 'No bio provided.'}</p>

                                <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                                    <button className="text-xs font-bold text-white uppercase hover:text-[#28D160] transition-colors">
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
