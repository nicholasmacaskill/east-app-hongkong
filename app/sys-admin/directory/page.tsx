'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Star, Users, Briefcase, Mail, Edit2, Trash2, Calendar, LayoutGrid, ChevronLeft, Shield, User, Coins, AlertCircle, X, Check } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { UserRole } from '@/app/types';
import AvailabilityModal from '../coaches/AvailabilityModal';

export default function DirectoryPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'households' | 'coaches' | 'admins'>('households');

    // Add User Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newUser, setNewUser] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'player' as UserRole,
        team: '',
        position: '',
        parentId: '',
        mobile: '',
        bio: ''
    });

    // Services State
    const [allServices, setAllServices] = useState<any[]>([]);
    const [coachServices, setCoachServices] = useState<Set<string>>(new Set());

    // Success / Invite State
    const [createdUser, setCreatedUser] = useState<any>(null);

    // Edit User State
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const [showAvailability, setShowAvailability] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<any>(null);

    // Normalization helper for search
    const normalize = (val: any) => val?.toString().toLowerCase().trim() || '';

    useEffect(() => {
        fetchProfiles();
        fetchServices();
    }, []);

    const fetchServices = async () => {
        const { data } = await supabase.from('session_types').select('*').order('title');
        if (data) setAllServices(data);
    };

    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('role', { ascending: false }) // Parents first usually
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching profiles:', error);
            alert('Failed to load data: ' + error.message);
        } else if (data) {
            setProfiles(data);
        }
        setLoading(false);
    };

    const handleAddUser = async () => {
        if (!newUser.email || !newUser.first_name || !newUser.last_name) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const apiEndpoint = newUser.role === 'coach' ? '/api/admin/create-coach' : '/api/admin/create-player';
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: newUser.first_name,
                    lastName: newUser.last_name,
                    email: newUser.email,
                    role: newUser.role,
                    team: newUser.team,
                    position: newUser.position,
                    parentId: newUser.parentId,
                    mobile: newUser.mobile,
                    bio: newUser.bio
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            setCreatedUser({
                id: data.userId,
                name: `${newUser.first_name} ${newUser.last_name}`,
                email: newUser.email,
                role: newUser.role
            });

            setShowAddForm(false);
            setNewUser({ first_name: '', last_name: '', email: '', role: 'player', team: '', position: '', parentId: '', mobile: '', bio: '' });
            fetchProfiles();

        } catch (error: any) {
            alert('Error creating user: ' + error.message);
        }
    };

    const handleEditClick = async (profile: any) => {
        setEditingUser({
            id: profile.id,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.contact_email || '',
            credits: profile.credits || 0,
            team: profile.team || '',
            position: profile.position || '',
            username: profile.username || '',
            role: profile.role || 'player',
            parentId: profile.parent_id || '',
            mobile: profile.mobile || '',
            bio: profile.bio || ''
        });

        if (profile.role === 'coach') {
            const { data } = await supabase
                .from('coach_services')
                .select('session_type_id')
                .eq('coach_id', profile.id);

            const assignedIds = new Set((data || []).map((row: any) => row.session_type_id));
            setCoachServices(assignedIds);
        }

        setShowEditForm(true);
    };

    const toggleService = (serviceId: string) => {
        setCoachServices(prev => {
            const next = new Set(prev);
            if (next.has(serviceId)) next.delete(serviceId);
            else next.add(serviceId);
            return next;
        });
    };


    const handleDeleteProfile = async (profileId: string, profileName: string) => {
        const confirmed = window.confirm(`Are you sure you want to delete ${profileName}?\n\nThis action cannot be undone.`);

        if (!confirmed) return;

        try {
            const response = await fetch('/api/admin/delete-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profileId })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            alert(`${profileName} deleted successfully.`);
            fetchProfiles();

        } catch (error: any) {
            alert('Error deleting: ' + error.message);
        }
    };

    const handleQuickCreditUpdate = async (userId: string, currentCredits: number, delta: number) => {
        const newCredits = Math.max(0, currentCredits + delta);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', userId);

            if (error) throw error;
            fetchProfiles(); // Refresh
        } catch (error: any) {
            alert('Failed to update credits: ' + error.message);
        }
    };

    const handleUpdateProfile = async () => {
        if (!editingUser || !editingUser.id) return;

        try {
            const response = await fetch('/api/admin/update-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingUser.id,
                    firstName: editingUser.first_name,
                    lastName: editingUser.last_name,
                    email: editingUser.email,
                    credits: parseInt(editingUser.credits),
                    team: editingUser.team,
                    position: editingUser.position,
                    username: editingUser.username,
                    role: editingUser.role,
                    parentId: editingUser.parentId,
                    mobile: editingUser.mobile,
                    bio: editingUser.bio,
                    password: editingUser.password
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            // Coach-specific: Update Services
            if (editingUser.role === 'coach') {
                await supabase.from('coach_services').delete().eq('coach_id', editingUser.id);
                const serviceInserts = Array.from(coachServices).map(svcId => ({
                    coach_id: editingUser.id,
                    session_type_id: svcId
                }));
                if (serviceInserts.length > 0) {
                    await supabase.from('coach_services').insert(serviceInserts);
                }
            }

            alert('Profile updated successfully');
            setShowEditForm(false);
            setEditingUser(null);
            fetchProfiles();

        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        }
    };

    const filteredProfiles = profiles.filter(p => {
        const search = searchTerm.toLowerCase();
        return (
            normalize(p.first_name || p.name).includes(search) ||
            normalize(p.last_name || p.surname).includes(search) ||
            normalize(p.team).includes(search) ||
            normalize(p.username).includes(search) ||
            normalize(p.contact_email).includes(search)
        );
    });

    // Grouping Logic
    const matchedParents = filteredProfiles.filter(p => p.role === 'parent' || p.role === 'sys-admin' || p.role === 'admin');
    const matchedPlayers = filteredProfiles.filter(p => p.role === 'player' || p.role === 'coach');

    // To ensure households are shown when searching for children:
    const parentsOfMatchedPlayers = matchedPlayers
        .map(p => p.parent_id)
        .filter(pid => pid);

    const parentIdsToShow = Array.from(new Set([
        ...matchedParents.map(p => p.id),
        ...parentsOfMatchedPlayers
    ]));

    // Final display lists
    const households = (profiles || []).filter(p => parentIdsToShow.includes(p.id));
    const allPlayers = (profiles || []).filter(p => (p.role === 'player' || p.role === 'coach') && (searchTerm ? filteredProfiles.includes(p) : true));
    const unassignedPlayers = matchedPlayers.filter(p => !p.parent_id && p.role === 'player');
    const coaches = (profiles || []).filter(p => p.role === 'coach' && (searchTerm ? filteredProfiles.includes(p) : true));
    const admins = (profiles || []).filter(p => (p.role === 'admin' || p.role === 'sys-admin') && (searchTerm ? filteredProfiles.includes(p) : true));

    // Stats
    const pendingInvites = (profiles || []).length; // Placeholder for now, real pending would check auth metadata or profile.id
    // Actually real pending would be profiles where they haven't logged in yet. 
    // For now let's just use placeholder logic or skip if too complex.

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-32 relative">

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Area */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sys-admin" className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-[#28D160] hover:text-black transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">People Directory</h1>
                            <p className="text-gray-400 text-xs">Manage households, coaches, and staff</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setNewUser({ ...newUser, role: 'parent' });
                                setShowAddForm(true);
                            }}
                            className="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-colors flex items-center gap-2 uppercase tracking-wide"
                        >
                            <Plus size={16} /> Add Parent
                        </button>
                        <button
                            onClick={() => {
                                setNewUser({ ...newUser, role: 'coach' });
                                setShowAddForm(true);
                            }}
                            className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-colors flex items-center gap-2 uppercase tracking-wide"
                        >
                            <Plus size={16} /> Add Coach
                        </button>
                        <button
                            onClick={() => {
                                setNewUser({ ...newUser, role: 'player' });
                                setShowAddForm(true);
                            }}
                            className="bg-[#28D160] text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-2 uppercase tracking-wide"
                        >
                            <Plus size={16} /> Add Athlete
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, team, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-none focus:border-[#28D160] transition-colors"
                    />
                </div>

                {/* Overview Tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                        onClick={() => setActiveTab('households')}
                        className={`bg-[#1e1e1e] border p-4 rounded-2xl hover:border-purple-500/50 cursor-pointer transition-all group ${activeTab === 'households' ? 'border-purple-500/30 ring-1 ring-purple-500/20' : 'border-white/5'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Users className="text-purple-400 group-hover:scale-110 transition-transform" size={20} />
                            <span className="text-[10px] font-black text-gray-600 uppercase">Households</span>
                        </div>
                        <p className="text-2xl font-black text-white">{households.length}</p>
                    </div>

                    <div
                        onClick={() => setActiveTab('households')}
                        className={`bg-[#1e1e1e] border p-4 rounded-2xl cursor-pointer transition-all group ${unassignedPlayers.length > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className={unassignedPlayers.length > 0 ? 'text-amber-500' : 'text-gray-600'} size={20} />
                            <span className="text-[10px] font-black text-gray-600 uppercase text-right">Unassigned<br />Athletes</span>
                        </div>
                        <p className={`text-2xl font-black ${unassignedPlayers.length > 0 ? 'text-amber-500' : 'text-white'}`}>{unassignedPlayers.length}</p>
                    </div>

                    <div
                        onClick={() => setActiveTab('coaches')}
                        className={`bg-[#1e1e1e] border p-4 rounded-2xl hover:border-[#28D160]/50 cursor-pointer transition-all group ${activeTab === 'coaches' ? 'border-[#28D160]/30 ring-1 ring-[#28D160]/20' : 'border-white/5'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Star className="text-[#28D160] group-hover:scale-110 transition-transform" size={20} />
                            <span className="text-[10px] font-black text-gray-600 uppercase">Coaches</span>
                        </div>
                        <p className="text-2xl font-black text-white">{coaches.length}</p>
                    </div>

                    <div className="bg-[#1e1e1e] border border-white/5 p-4 rounded-2xl opacity-50">
                        <div className="flex items-center justify-between mb-2">
                            <Mail className="text-blue-400" size={20} />
                            <span className="text-[10px] font-black text-gray-600 uppercase text-right">Pending<br />Invites</span>
                        </div>
                        <p className="text-2xl font-black text-white">-</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl self-start">
                    {(['households', 'coaches', 'admins'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase italic transition-all ${activeTab === tab ? 'bg-white/10 text-[#28D160] shadow-sm' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Success / Invite Modal */}
                {
                    createdUser && (
                        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                            <div className="bg-[#1e1e1e] p-8 rounded-[2.5rem] w-full max-w-md border border-[#28D160]/30 flex flex-col items-center text-center relative shadow-2xl shadow-[#28D160]/10">
                                <button
                                    onClick={() => setCreatedUser(null)}
                                    className="absolute top-6 right-6 text-gray-500 hover:text-white"
                                >
                                    <X size={24} />
                                </button>

                                <div className="w-16 h-16 bg-[#28D160] rounded-full flex items-center justify-center mb-6 text-black">
                                    <Shield size={32} />
                                </div>

                                <h2 className="font-black italic text-2xl uppercase mb-2 text-white">Invite Sent!</h2>
                                <p className="text-gray-400 text-sm mb-8">An automated invite has been sent to {createdUser.email}.</p>

                                <div className="bg-black/40 w-full p-5 rounded-2xl border border-white/5 text-left mb-8">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Name</p>
                                    <p className="font-bold text-white mb-4 text-lg">{createdUser.name}</p>

                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Account Role</p>
                                    <p className="font-black italic text-[#28D160] uppercase">{createdUser.role}</p>
                                </div>

                                <button
                                    onClick={() => setCreatedUser(null)}
                                    className="w-full bg-[#28D160] text-black font-black italic py-4 rounded-xl uppercase hover:bg-white transition-all tracking-widest shadow-lg active:scale-95"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Add User Modal */}
                {
                    showAddForm && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                            <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                                <h2 className="font-black italic text-xl uppercase mb-4 text-[#28D160]">
                                    {newUser.role === 'coach' ? 'Add New Coach' : newUser.role === 'parent' ? 'Add New Household' : 'Add New Athlete'}
                                </h2>
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                                            <input
                                                value={newUser.first_name}
                                                onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                                            <input
                                                value={newUser.last_name}
                                                onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Email (Invite Link)</label>
                                        <input
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            placeholder="user@example.com"
                                        />
                                    </div>

                                    {newUser.role === 'coach' && (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                                                <input
                                                    value={newUser.mobile}
                                                    onChange={e => setNewUser({ ...newUser, mobile: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                    placeholder="+852 ..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Bio</label>
                                                <textarea
                                                    value={newUser.bio}
                                                    onChange={e => setNewUser({ ...newUser, bio: e.target.value })}
                                                    rows={2}
                                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                    placeholder="Coach biography..."
                                                />
                                            </div>
                                        </>
                                    )}

                                    {newUser.role === 'player' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Team</label>
                                                    <input
                                                        value={newUser.team}
                                                        onChange={e => setNewUser({ ...newUser, team: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                        placeholder="U12 Elite"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Position</label>
                                                    <input
                                                        value={newUser.position}
                                                        onChange={e => setNewUser({ ...newUser, position: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                        placeholder="Forward"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Link to Parent</label>
                                                <select
                                                    value={newUser.parentId}
                                                    onChange={e => setNewUser({ ...newUser, parentId: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                >
                                                    <option value="">No Parent (Freelance)</option>
                                                    {profiles.filter(p => p.role === 'parent').map(p => (
                                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        <button onClick={handleAddUser} className="flex-1 bg-[#28D160] text-black font-black italic py-3 rounded-xl uppercase text-xs hover:bg-white transition-all shadow-lg active:scale-95">Send Invite</button>
                                        <button onClick={() => setShowAddForm(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl uppercase text-xs hover:bg-white/20 transition-all">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Edit User Modal */}
                {
                    showEditForm && editingUser && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                            <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                                <h2 className="font-black italic text-xl uppercase mb-4 text-[#28D160]">Edit Profile</h2>
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                                            <input
                                                value={editingUser.first_name}
                                                onChange={e => setEditingUser({ ...editingUser, first_name: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                                            <input
                                                value={editingUser.last_name}
                                                onChange={e => setEditingUser({ ...editingUser, last_name: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Credits</label>
                                            <input
                                                type="number"
                                                value={editingUser.credits}
                                                onChange={e => setEditingUser({ ...editingUser, credits: e.target.value })}
                                                className="w-full bg-black/50 border border-[#28D160]/30 p-2 rounded-lg text-white font-bold text-sm outline-none focus:border-[#28D160]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Username</label>
                                            <input
                                                value={editingUser.username}
                                                onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                                        <input
                                            value={editingUser.email}
                                            onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">New Password (Optional)</label>
                                        <input
                                            type="password"
                                            value={editingUser.password || ''}
                                            onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            placeholder="Leave blank to keep current"
                                        />
                                    </div>

                                    <div className={`grid ${editingUser.role === 'player' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Role</label>
                                            <select
                                                value={editingUser.role}
                                                onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                            >
                                                <option value="player">Athlete</option>
                                                <option value="parent">Parent</option>
                                                <option value="coach">Coach</option>
                                                <option value="admin">Admin</option>
                                                <option value="sys-admin">Sys Admin</option>
                                            </select>
                                        </div>
                                        {editingUser.role === 'player' && (
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Parent Link</label>
                                                <select
                                                    value={editingUser.parentId}
                                                    onChange={e => setEditingUser({ ...editingUser, parentId: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                >
                                                    <option value="">No Parent (Unassigned)</option>
                                                    {profiles.filter(p => p.role === 'parent' || p.role === 'admin' || p.role === 'sys-admin').map(p => (
                                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {(editingUser.role === 'coach' || editingUser.role === 'player') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">{editingUser.role === 'coach' ? 'Mobile' : 'Team'}</label>
                                                <input
                                                    value={editingUser.role === 'coach' ? editingUser.mobile : editingUser.team}
                                                    onChange={e => setEditingUser({ ...editingUser, [editingUser.role === 'coach' ? 'mobile' : 'team']: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">{editingUser.role === 'coach' ? 'Bio' : 'Position'}</label>
                                                {editingUser.role === 'coach' ? (
                                                    <textarea
                                                        value={editingUser.bio}
                                                        onChange={e => setEditingUser({ ...editingUser, bio: e.target.value })}
                                                        rows={1}
                                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                    />
                                                ) : (
                                                    <input
                                                        value={editingUser.position}
                                                        onChange={e => setEditingUser({ ...editingUser, position: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Service Assignment for Coaches */}
                                    {editingUser.role === 'coach' && (
                                        <div className="border-t border-white/10 pt-4">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1">
                                                <Star size={12} /> Assigned Services
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {allServices.map(svc => (
                                                    <div
                                                        key={svc.id}
                                                        onClick={() => toggleService(svc.id)}
                                                        className={`p-2 rounded border cursor-pointer text-[10px] font-bold transition-colors flex items-center gap-2 ${coachServices.has(svc.id) ? 'bg-[#28D160]/20 border-[#28D160] text-[#28D160]' : 'bg-black/30 border-white/10 text-gray-500 hover:border-white/30'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full border ${coachServices.has(svc.id) ? 'bg-[#28D160] border-[#28D160]' : 'border-gray-600'}`}></div>
                                                        {svc.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        <button onClick={handleUpdateProfile} className="flex-1 bg-[#28D160] text-black font-black italic py-3 rounded-xl uppercase text-xs hover:bg-white transition-all shadow-lg active:scale-95">Save Changes</button>
                                        <button onClick={() => setShowEditForm(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl uppercase text-xs hover:bg-white/20 transition-all">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }


                {/* NESTED LIST */}
                <div className="flex flex-col gap-8">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4">
                            <Plus className="animate-spin text-[#28D160]" size={32} />
                            <span className="font-bold uppercase tracking-widest text-[10px]">Syncing Database...</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'households' && (
                                <div className="flex flex-col gap-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Households ({households.length})</h2>
                                    {households.map(parent => {
                                        const children = allPlayers.filter(p => p.parent_id === parent.id);
                                        return (
                                            <div key={parent.id} className="bg-[#1e1e1e] rounded-3xl border border-white/5 overflow-hidden">
                                                {/* Parent Row */}
                                                <div className="p-5 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-purple-900/10 to-transparent group/row">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center">
                                                            <User className="text-purple-400" size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white text-lg">{parent.first_name} {parent.last_name}</h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black italic text-purple-400 uppercase">{parent.role}</span>
                                                                <span className="text-gray-600 text-[10px]">•</span>
                                                                <span className="text-gray-500 text-[10px]">{parent.contact_email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => {
                                                            setNewUser({ ...newUser, role: 'player', parentId: parent.id });
                                                            setShowAddForm(true);
                                                        }} className="text-[10px] font-black italic text-[#28D160] uppercase bg-[#28D160]/10 px-3 py-1.5 rounded-lg hover:bg-[#28D160] hover:text-black transition-all">
                                                            + Add Child
                                                        </button>
                                                        <button onClick={() => handleEditClick(parent)} className="p-2 text-gray-500 hover:text-white transition-colors">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteProfile(parent.id, `${parent.first_name} ${parent.last_name}`)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Children Rows */}
                                                <div className="bg-black/20 p-2">
                                                    {children.length === 0 ? (
                                                        <p className="text-[10px] text-gray-600 italic p-4 text-center">No athletes registered in this household.</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {children.map(child => (
                                                                <div key={child.id} className="bg-[#252525]/50 rounded-2xl p-4 border border-white/5 flex items-center justify-between group">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-white p-1">
                                                                            <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${child.id}`} size={32} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-white text-sm">{child.first_name} {child.last_name}</p>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => handleEditClick(child)}
                                                                                    className="text-[8px] bg-[#28D160]/10 text-[#28D160] px-1.5 py-0.5 rounded uppercase font-black italic hover:bg-[#28D160] hover:text-black transition-colors"
                                                                                >
                                                                                    {child.team || 'ASSIGN TEAM'}
                                                                                </button>
                                                                                <span className="text-gray-600 text-[8px]">•</span>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Coins size={10} className="text-amber-500" />
                                                                                    <span className="text-[8px] text-gray-500 uppercase font-black italic">{child.credits}</span>
                                                                                    <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <button
                                                                                            onClick={() => handleQuickCreditUpdate(child.id, child.credits, 10)}
                                                                                            className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[8px] font-bold hover:bg-amber-500 hover:text-black"
                                                                                        >
                                                                                            +
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1 transition-opacity">
                                                                        <button onClick={() => handleEditClick(child)} className="p-1.5 text-gray-400 hover:text-[#28D160]">
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button onClick={() => handleDeleteProfile(child.id, `${child.first_name} ${child.last_name}`)} className="p-1.5 text-gray-400 hover:text-red-500">
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Unassigned Section inside Household Tab if active */}
                                    {unassignedPlayers.length > 0 && (
                                        <div className="mt-8 flex flex-col gap-4">
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 ml-2">Unassigned Athletes ({unassignedPlayers.length})</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {unassignedPlayers.map(player => (
                                                    <div key={player.id} className="bg-[#1e1e1e] rounded-2xl p-4 border border-amber-500/20 flex items-center justify-between group/row">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white p-1">
                                                                <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${player.id}`} size={32} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white text-sm">{player.first_name} {player.last_name}</p>
                                                                <div className="flex gap-2">
                                                                    <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase font-black italic">UNASSIGNED</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 transition-opacity">
                                                            <button onClick={() => handleEditClick(player)} className="p-1.5 text-gray-400 hover:text-[#28D160]">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteProfile(player.id, `${player.first_name} ${player.last_name}`)} className="p-1.5 text-gray-400 hover:text-red-500">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'coaches' && (
                                <div className="flex flex-col gap-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Active Coaches ({coaches.length})</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {coaches.map(coach => (
                                            <div key={coach.id} className="bg-[#1e1e1e] rounded-2xl p-4 border border-white/5 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-[#28D160]/10 border border-[#28D160]/20 flex items-center justify-center">
                                                        <Star className="text-[#28D160]" size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{coach.first_name} {coach.last_name}</p>
                                                        <p className="text-[10px] text-gray-500">{coach.contact_email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 transition-opacity">
                                                    <button onClick={() => { setSelectedCoach(coach); setShowAvailability(true); }} className="p-1.5 text-gray-400 hover:text-blue-400" title="Manage Availability">
                                                        <Calendar size={14} />
                                                    </button>
                                                    <Link href={`/sys-admin/schedule?instructor=${encodeURIComponent(coach.first_name + ' ' + coach.last_name)}`} className="p-1.5 text-gray-400 hover:text-[#28D160]" title="Add Session">
                                                        <Plus size={14} />
                                                    </Link>
                                                    <button onClick={() => handleEditClick(coach)} className="p-1.5 text-gray-400 hover:text-[#28D160]">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteProfile(coach.id, `${coach.first_name} ${coach.last_name}`)} className="p-1.5 text-gray-400 hover:text-red-500">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'admins' && (
                                <div className="flex flex-col gap-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Administrative Staff ({admins.length})</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {admins.map(admin => (
                                            <div key={admin.id} className="bg-[#1e1e1e] rounded-2xl p-4 border border-white/5 flex items-center justify-between group/row">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                                                        <Shield className="text-blue-400" size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{admin.first_name} {admin.last_name}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase font-black italic text-blue-400">{admin.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 transition-opacity">
                                                    <button onClick={() => handleEditClick(admin)} className="p-1.5 text-gray-400 hover:text-[#28D160]">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteProfile(admin.id, `${admin.first_name} ${admin.last_name}`)} className="p-1.5 text-gray-400 hover:text-red-500">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
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
        </div>
    );
}
