'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Search, Trash2, Edit2, Shield, X, Lock, Calendar } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import AvailabilityModal from './AvailabilityModal';

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
        password: '', // Manual password support
        mobile: '',
        bio: ''
    });

    // Edit Coach State
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingCoach, setEditingCoach] = useState<any>(null);

    // Availability Modal State
    const [showAvailability, setShowAvailability] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<any>(null);

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
        if (!newCoach.first_name || !newCoach.last_name || !newCoach.email || !newCoach.password) {
            return alert("Please fill required fields (Name, Email, Password)");
        }

        try {
            const response = await fetch('/api/admin/create-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newCoach.email,
                    password: newCoach.password,
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
                // Determine the new coach object to set as selected
                // Ideally the API should return the full object, but we can construct enough for the modal
                const createdCoach = {
                    id: result.userId,
                    first_name: newCoach.first_name,
                    last_name: newCoach.last_name
                };

                alert('Coach added successfully! You can now set their availability.');
                setShowAddForm(false);
                setNewCoach({ first_name: '', last_name: '', email: '', password: '', mobile: '', bio: '' });
                fetchCoaches(); // Refresh list in background

                // Open availability immediately
                setSelectedCoach(createdCoach);
                setShowAvailability(true);
            }
        } catch (err) {
            alert('Failed to connect to server.');
            console.error(err);
        }
    };

    const handleEditClick = (coach: any) => {
        setEditingCoach({
            id: coach.id,
            first_name: coach.first_name || '',
            last_name: coach.last_name || '',
            email: coach.contact_email || '',
            mobile: coach.mobile || '',
            bio: coach.bio || '',
            password: '' // Placeholder
        });
        setShowEditForm(true);
    };

    const handleDeleteCoach = async (coachId: string, coachName: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${coachName}?\n\nThis action cannot be undone and will remove:\n• Coach profile\n• Availability settings\n• Auth account`
        );

        if (!confirmed) return;

        try {
            const response = await fetch('/api/admin/delete-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: coachId })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            alert(`${coachName} has been deleted successfully`);
            fetchCoaches(); // Refresh list

        } catch (error: any) {
            alert('Error deleting coach: ' + error.message);
        }
    };

    const handleUpdateCoach = async () => {
        if (!editingCoach) return;

        try {
            const response = await fetch('/api/admin/update-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingCoach.id,
                    firstName: editingCoach.first_name,
                    lastName: editingCoach.last_name,
                    email: editingCoach.email,
                    password: editingCoach.password,
                    mobile: editingCoach.mobile,
                    bio: editingCoach.bio
                })
            });

            const result = await response.json();
            if (!result.success) {
                alert('Error updating coach: ' + result.error);
            } else {
                alert('Coach updated successfully.');
                setShowEditForm(false);
                setEditingCoach(null);
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
        <div className="flex flex-col gap-6 animate-fadeIn pb-20">
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
                <div className="flex gap-4">
                    <Link
                        href="/sys-admin/schedule"
                        className="bg-white/10 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 uppercase tracking-wide"
                    >
                        <Calendar size={16} /> View Master Schedule
                    </Link>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-[#28D160] text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-2 uppercase tracking-wide"
                    >
                        <Plus size={16} /> Add Coach
                    </button>
                </div>
            </div>

            {/* Add Coach Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
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
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Password *</label>
                                <input
                                    value={newCoach.password}
                                    onChange={e => setNewCoach({ ...newCoach, password: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    type="text"
                                    placeholder="Set initial password"
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
                                <button onClick={handleAddCoach} className="flex-1 bg-[#28D160] text-black font-bold py-2 rounded uppercase text-xs hover:bg-white transition-colors">Create Coach</button>
                                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-white/10 text-white font-bold py-2 rounded uppercase text-xs hover:bg-white/20 transition-colors">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Coach Modal */}
            {showEditForm && editingCoach && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                        <h2 className="font-black italic text-xl uppercase mb-4">Edit Coach Profile</h2>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                                    <input
                                        value={editingCoach.first_name}
                                        onChange={e => setEditingCoach({ ...editingCoach, first_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                                    <input
                                        value={editingCoach.last_name}
                                        onChange={e => setEditingCoach({ ...editingCoach, last_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Email</label>
                                <input
                                    value={editingCoach.email}
                                    onChange={e => setEditingCoach({ ...editingCoach, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                                <input
                                    value={editingCoach.mobile}
                                    onChange={e => setEditingCoach({ ...editingCoach, mobile: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Bio</label>
                                <textarea
                                    value={editingCoach.bio}
                                    onChange={e => setEditingCoach({ ...editingCoach, bio: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20">
                                <label className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1 mb-1">
                                    <Lock size={12} /> Reset Password
                                </label>
                                <input
                                    value={editingCoach.password}
                                    onChange={e => setEditingCoach({ ...editingCoach, password: e.target.value })}
                                    placeholder="Leave blank to keep current"
                                    className="w-full bg-black/50 border border-red-500/20 p-2 rounded text-white text-sm outline-none focus:border-red-500"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleUpdateCoach} className="flex-1 bg-[#28D160] text-black font-bold py-2 rounded uppercase text-xs hover:bg-white transition-colors">Save Changes</button>
                                <button onClick={() => { setShowEditForm(false); setEditingCoach(null); }} className="flex-1 bg-white/10 text-white font-bold py-2 rounded uppercase text-xs hover:bg-white/20 transition-colors">Cancel</button>
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
                                    <span className="text-[10px] bg-[#28D160]/20 text-[#28D160] px-2 py-0.5 rounded uppercase font-black italic">
                                        Coach
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs">{coach.contact_email}</p>
                                {coach.mobile && <p className="text-gray-500 text-xs">{coach.mobile}</p>}
                                <p className="text-gray-500 text-sm mt-2 line-clamp-2 italic">{coach.bio || 'No bio provided.'}</p>

                                <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                                    <button onClick={() => handleEditClick(coach)} className="text-xs font-bold text-[#28D160] uppercase hover:text-white transition-colors flex items-center gap-1">
                                        <Edit2 size={12} /> Edit Profile
                                    </button>
                                    <button onClick={() => { setSelectedCoach(coach); setShowAvailability(true); }} className="text-xs font-bold text-blue-400 uppercase hover:text-white transition-colors flex items-center gap-1">
                                        <Calendar size={12} /> Availability
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCoach(coach.id, `${coach.first_name} ${coach.last_name}`)}
                                        className="text-xs font-bold text-gray-400 uppercase hover:text-red-500 transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Availability Modal */}
            {showAvailability && selectedCoach && (
                <AvailabilityModal
                    coach={selectedCoach}
                    onClose={() => { setShowAvailability(false); setSelectedCoach(null); }}
                />
            )}
        </div>
    );
}
