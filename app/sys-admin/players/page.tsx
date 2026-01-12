'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Search, QrCode as QrIcon, Trash2, Edit2, Shield, Copy, X, User } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

export default function PlayerManagement() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Add Player Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPlayer, setNewPlayer] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        team: '',
        position: ''
    });

    // Success / QR State
    const [createdPlayer, setCreatedPlayer] = useState<any>(null);

    // Edit Player State
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<any>(null);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching players:', error);
            alert('Failed to load players: ' + error.message);
        } else if (data) {
            setPlayers(data);
        }
        setLoading(false);
    };

    const handleAddPlayer = async () => {
        if (!newPlayer.email || !newPlayer.password || !newPlayer.first_name || !newPlayer.last_name) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/admin/create-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: newPlayer.first_name,
                    lastName: newPlayer.last_name,
                    email: newPlayer.email,
                    password: newPlayer.password,
                    team: newPlayer.team,
                    position: newPlayer.position
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            setCreatedPlayer({
                id: data.userId,
                name: `${newPlayer.first_name} ${newPlayer.last_name}`,
                email: newPlayer.email,
                team: newPlayer.team
            });

            setShowAddForm(false);
            setNewPlayer({ first_name: '', last_name: '', email: '', password: '', team: '', position: '' });
            fetchPlayers();

        } catch (error: any) {
            alert('Error creating player: ' + error.message);
        }
    };

    const handleEditClick = (player: any) => {
        setEditingPlayer({
            id: player.id,
            first_name: player.first_name || '',
            last_name: player.last_name || '',
            email: player.contact_email || '',
            credits: player.credits || 0,
            team: player.team || '',
            position: player.position || '',
            username: player.username || '',
            password: '' // Placeholder
        });
        setShowEditForm(true);
    };

    const handleDeletePlayer = async (playerId: string, playerName: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${playerName}?\n\nThis action cannot be undone and will remove:\n• Player profile\n• All bookings and registrations\n• Auth account`
        );

        if (!confirmed) return;

        try {
            const response = await fetch('/api/admin/delete-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: playerId })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            alert(`${playerName} has been deleted successfully`);
            fetchPlayers(); // Refresh list

        } catch (error: any) {
            alert('Error deleting player: ' + error.message);
        }
    };

    const handleUpdatePlayer = async () => {
        if (!editingPlayer || !editingPlayer.id) return;

        try {
            const response = await fetch('/api/admin/update-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingPlayer.id,
                    firstName: editingPlayer.first_name,
                    lastName: editingPlayer.last_name,
                    email: editingPlayer.email,
                    password: editingPlayer.password,
                    credits: parseInt(editingPlayer.credits),
                    team: editingPlayer.team,
                    position: editingPlayer.position,
                    username: editingPlayer.username
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            alert('Player updated successfully');
            setShowEditForm(false);
            setEditingPlayer(null);
            fetchPlayers();

        } catch (error: any) {
            alert('Error updating player: ' + error.message);
        }
    };

    const filteredPlayers = players.filter(p =>
    ((p.first_name || p.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.last_name || p.surname)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username?.toLowerCase().includes(searchTerm.toLowerCase()))
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
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Players</h1>
                        <p className="text-gray-400 text-xs">Manage roster & account details</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-[#28D160] text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-2 uppercase tracking-wide"
                >
                    <Plus size={16} /> Add Player
                </button>
            </div>

            {/* Success / QR Modal */}
            {createdPlayer && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-8 rounded-[2.5rem] w-full max-w-md border border-[#28D160]/30 flex flex-col items-center text-center relative shadow-2xl shadow-[#28D160]/10">
                        <button
                            onClick={() => setCreatedPlayer(null)}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-16 h-16 bg-[#28D160] rounded-full flex items-center justify-center mb-6 text-black">
                            <QrIcon size={32} />
                        </div>

                        <h2 className="font-black italic text-2xl uppercase mb-2 text-white">Player Created!</h2>
                        <p className="text-gray-400 text-sm mb-8">Scan or screenshot this QR code for the player.</p>

                        <div className="bg-white p-6 rounded-3xl mb-8 shadow-xl">
                            <QRCodeSVG
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${createdPlayer.id}`}
                                size={200}
                            />
                        </div>

                        <div className="bg-black/40 w-full p-5 rounded-2xl border border-white/5 text-left mb-8">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Assigned Name</p>
                            <p className="font-bold text-white mb-4 text-lg">{createdPlayer.name}</p>

                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Login Email</p>
                            <div className="flex justify-between items-center group">
                                <p className="font-mono text-[#28D160] group-hover:text-white transition-colors cursor-copy">{createdPlayer.email}</p>
                                <Copy size={16} className="text-gray-600 hover:text-white cursor-pointer" />
                            </div>
                        </div>

                        <button
                            onClick={() => setCreatedPlayer(null)}
                            className="w-full bg-[#28D160] text-black font-black italic py-4 rounded-xl uppercase hover:bg-white transition-all tracking-widest shadow-lg active:scale-95"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Add Player Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                        <h2 className="font-black italic text-xl uppercase mb-4 text-[#28D160]">Add New Player</h2>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                                    <input
                                        value={newPlayer.first_name}
                                        onChange={e => setNewPlayer({ ...newPlayer, first_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                                    <input
                                        value={newPlayer.last_name}
                                        onChange={e => setNewPlayer({ ...newPlayer, last_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Email (Login)</label>
                                <input
                                    value={newPlayer.email}
                                    onChange={e => setNewPlayer({ ...newPlayer, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    placeholder="player@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                                <input
                                    value={newPlayer.password}
                                    onChange={e => setNewPlayer({ ...newPlayer, password: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    type="text"
                                    placeholder="Set temporary password"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Team</label>
                                    <input
                                        value={newPlayer.team}
                                        onChange={e => setNewPlayer({ ...newPlayer, team: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                        placeholder="U12 Elite"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Position</label>
                                    <input
                                        value={newPlayer.position}
                                        onChange={e => setNewPlayer({ ...newPlayer, position: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                        placeholder="Forward"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button onClick={handleAddPlayer} className="flex-1 bg-[#28D160] text-black font-black italic py-3 rounded-xl uppercase text-xs hover:bg-white transition-all shadow-lg active:scale-95">Create Account</button>
                                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl uppercase text-xs hover:bg-white/20 transition-all">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Player Modal */}
            {showEditForm && editingPlayer && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                        <h2 className="font-black italic text-xl uppercase mb-4 text-[#28D160]">Edit Player Account</h2>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                                    <input
                                        value={editingPlayer.first_name}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, first_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                                    <input
                                        value={editingPlayer.last_name}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, last_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Credits (Balance)</label>
                                    <input
                                        type="number"
                                        value={editingPlayer.credits}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, credits: e.target.value })}
                                        className="w-full bg-black/50 border border-[#28D160]/30 p-2 rounded-lg text-white font-bold text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Username</label>
                                    <input
                                        value={editingPlayer.username}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, username: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Email (Admin Search Only)</label>
                                <input
                                    value={editingPlayer.email}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Team</label>
                                    <input
                                        value={editingPlayer.team}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, team: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Position</label>
                                    <input
                                        value={editingPlayer.position}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20">
                                <label className="text-[10px] font-bold text-red-400 uppercase block mb-1">Set New Password</label>
                                <input
                                    value={editingPlayer.password}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, password: e.target.value })}
                                    className="w-full bg-black/50 border border-red-500/20 p-2 rounded-lg text-white text-sm outline-none focus:border-red-500"
                                    placeholder="Leave blank to keep current"
                                    type="text"
                                />
                                <p className="text-[9px] text-gray-500 mt-2 italic font-bold">This will immediately update the player's login credentials.</p>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button onClick={handleUpdatePlayer} className="flex-1 bg-[#28D160] text-black font-black italic py-3 rounded-xl uppercase text-xs hover:bg-white transition-all shadow-lg active:scale-95">Save Changes</button>
                                <button onClick={() => setShowEditForm(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl uppercase text-xs hover:bg-white/20 transition-all">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="Search by name, team, or username..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/5 pl-12 pr-4 py-4 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#28D160] focus:bg-[#252525] transition-all"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-500 flex flex-col items-center gap-4">
                        <Plus className="animate-spin text-[#28D160]" size={32} />
                        <span className="font-bold uppercase tracking-widest text-[10px]">Loading Player Database...</span>
                    </div>
                ) : filteredPlayers.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs">No records matching your search.</div>
                ) : (
                    filteredPlayers.map(player => {
                        const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${player.id}` : '#';

                        return (
                            <div key={player.id} className="bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/5 group hover:border-[#28D160]/50 transition-all shadow-xl hover:-translate-y-1">
                                <div className="p-5 flex gap-5">
                                    {/* QR Thumbnail */}
                                    <div className="w-20 h-20 bg-white p-1.5 rounded-xl shrink-0 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                        <QRCodeSVG value={profileUrl} size={68} />
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-white truncate text-lg">
                                                {player.first_name || player.name} {player.last_name || player.surname}
                                            </h3>
                                            <span className="text-[9px] bg-[#28D160]/10 border border-[#28D160]/20 px-2 py-0.5 rounded text-[#28D160] font-black italic uppercase shrink-0">
                                                {player.team || 'FREE AGENT'}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-[10px] font-mono truncate mt-0.5 opacity-60">@{player.username || 'no-username'}</p>

                                        <div className="flex gap-3 items-center mt-3">
                                            <button onClick={() => handleEditClick(player)} className="text-[10px] font-black italic text-gray-400 uppercase hover:text-[#28D160] transition-colors flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                                <Edit2 size={12} /> Account
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlayer(player.id, `${player.first_name} ${player.last_name}`)}
                                                className="text-[10px] font-black italic text-gray-400 uppercase hover:text-red-500 transition-colors flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                            <div className="h-3 w-px bg-white/10" />
                                            <div className="text-[10px] font-black text-white uppercase italic">
                                                {player.credits} <span className="text-gray-500">Credits</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-black/40 px-5 py-3 flex justify-between items-center group-hover:bg-[#28D160]/5 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#28D160] animate-pulse" />
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Active Status</span>
                                    </div>
                                    <Link href={`/profile/${player.id}`} className="text-[9px] font-black text-[#28D160] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                        View Profile <ChevronLeft size={10} className="rotate-180" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
