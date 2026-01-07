'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Search, QrCode as QrIcon, Trash2, Edit2, Shield, Copy, X } from 'lucide-react';
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
    const [createdPlayer, setCreatedPlayer] = useState<any>(null); // Stores details of player just created

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

            // Success! Show QR code
            setCreatedPlayer({
                id: data.userId,
                name: `${newPlayer.first_name} ${newPlayer.last_name}`,
                email: newPlayer.email,
                team: newPlayer.team
            });

            setShowAddForm(false);
            setNewPlayer({ first_name: '', last_name: '', email: '', password: 'password123', team: '', position: '' });
            fetchPlayers();

        } catch (error: any) {
            alert('Error creating player: ' + error.message);
        }
    };

    const handleEditClick = (player: any) => {
        setEditingPlayer({
            id: player.id,
            first_name: player.first_name || player.name?.split(' ')[0] || '',
            last_name: player.last_name || player.name?.split(' ').slice(1).join(' ') || '',
            email: player.contact_email || '', // Ideally fetch auth email if possible, but contact_email is proxy
            credits: player.credits || 0,
            team: player.team || '',
            position: player.position || '',
            password: '' // Placeholder, empty means don't change
        });
        setShowEditForm(true);
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
                    password: editingPlayer.password, // Only sent if user typed something
                    credits: parseInt(editingPlayer.credits),
                    team: editingPlayer.team,
                    position: editingPlayer.position
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            alert('Player updated successfully');
            setShowEditForm(false);
            setEditingPlayer(null);
            fetchPlayers(); // Refresh list

        } catch (error: any) {
            alert('Error updating player: ' + error.message);
        }
    };

    const filteredPlayers = players.filter(p =>
    ((p.first_name || p.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.last_name || p.surname)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team?.toLowerCase().includes(searchTerm.toLowerCase()))
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
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Players</h1>
                        <p className="text-gray-400 text-xs">Manage roster & QR codes</p>
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
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-8 rounded-3xl w-full max-w-md border border-[#28D160] flex flex-col items-center text-center relative shadow-2xl shadow-[#28D160]/20">
                        <button
                            onClick={() => setCreatedPlayer(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-16 h-16 bg-[#28D160] rounded-full flex items-center justify-center mb-6 text-black">
                            <QrIcon size={32} />
                        </div>

                        <h2 className="font-black italic text-2xl uppercase mb-2 text-white">Player Created!</h2>
                        <p className="text-gray-400 text-sm mb-8">Scan or screenshot this QR code for the player.</p>

                        <div className="bg-white p-6 rounded-2xl mb-6">
                            <QRCodeSVG
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${createdPlayer.id}`}
                                size={200}
                            />
                        </div>

                        <div className="bg-black/30 w-full p-4 rounded-xl border border-white/10 text-left mb-6">
                            <p className="text-xs text-gray-500 uppercase mb-1">Name</p>
                            <p className="font-bold text-white mb-3">{createdPlayer.name}</p>

                            <p className="text-xs text-gray-500 uppercase mb-1">Login Email</p>
                            <div className="flex justify-between items-center">
                                <p className="font-mono text-[#28D160]">{createdPlayer.email}</p>
                                <Copy size={14} className="text-gray-600 hover:text-white cursor-pointer" />
                            </div>
                        </div>

                        <button
                            onClick={() => setCreatedPlayer(null)}
                            className="w-full bg-[#28D160] text-black font-bold py-3 rounded-xl uppercase hover:bg-white transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Add Player Modal/Form */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10">
                        <h2 className="font-black italic text-xl uppercase mb-4">Add New Player</h2>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                                    <input
                                        value={newPlayer.first_name}
                                        onChange={e => setNewPlayer({ ...newPlayer, first_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                                    <input
                                        value={newPlayer.last_name}
                                        onChange={e => setNewPlayer({ ...newPlayer, last_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            {/* New Auth Fields */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Email (Login)</label>
                                <input
                                    value={newPlayer.email}
                                    onChange={e => setNewPlayer({ ...newPlayer, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    placeholder="player@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Team</label>
                                <input
                                    value={newPlayer.team}
                                    onChange={e => setNewPlayer({ ...newPlayer, team: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    placeholder="e.g. U12 Elite"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Position</label>
                                <input
                                    value={newPlayer.position}
                                    onChange={e => setNewPlayer({ ...newPlayer, position: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    placeholder="e.g. Center, Defense"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                                <input
                                    value={newPlayer.password}
                                    onChange={e => setNewPlayer({ ...newPlayer, password: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    type="text"
                                />
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button onClick={handleAddPlayer} className="flex-1 bg-[#28D160] text-black font-bold py-2 rounded uppercase text-xs hover:bg-white transition-colors">Create Account</button>
                                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-white/10 text-white font-bold py-2 rounded uppercase text-xs hover:bg-white/20 transition-colors">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Player Modal */}
            {showEditForm && editingPlayer && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                        <h2 className="font-black italic text-xl uppercase mb-4">Edit Player</h2>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                                    <input
                                        value={editingPlayer.first_name}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, first_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                                    <input
                                        value={editingPlayer.last_name}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, last_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Credits (Balance)</label>
                                <input
                                    type="number"
                                    value={editingPlayer.credits}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, credits: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Email (Login)</label>
                                <input
                                    value={editingPlayer.email}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Team</label>
                                    <input
                                        value={editingPlayer.team}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, team: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Position</label>
                                    <input
                                        value={editingPlayer.position}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                                <label className="text-[10px] font-bold text-red-400 uppercase block mb-1">Reset Password</label>
                                <input
                                    value={editingPlayer.password}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, password: e.target.value })}
                                    className="w-full bg-black/50 border border-red-500/30 p-2 rounded text-white text-sm outline-none focus:border-red-500"
                                    placeholder="Leave blank to keep current"
                                    type="text"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Only enter value to override existing password.</p>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button onClick={handleUpdatePlayer} className="flex-1 bg-[#28D160] text-black font-bold py-2 rounded uppercase text-xs hover:bg-white transition-colors">Save Changes</button>
                                <button onClick={() => setShowEditForm(false)} className="flex-1 bg-white/10 text-white font-bold py-2 rounded uppercase text-xs hover:bg-white/20 transition-colors">Cancel</button>
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
                    placeholder="Search by name or team..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/5 pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#28D160]"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Loading players...</div>
                ) : filteredPlayers.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">No players found.</div>
                ) : (
                    filteredPlayers.map(player => {
                        const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${player.id}` : '#';

                        return (
                            <div key={player.id} className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/5 group hover:border-[#28D160]/50 transition-colors">
                                <div className="p-4 flex gap-4">
                                    {/* QR Code */}
                                    <div className="w-20 h-20 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                                        <QRCodeSVG value={profileUrl} size={72} />
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-bold text-white truncate pr-2">
                                                {player.first_name || player.name} {player.last_name || player.surname}
                                            </h3>
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 uppercase shrink-0">
                                                {player.team || 'No Team'}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs truncate mt-1">ID: {player.id}</p>
                                        <div className="flex gap-2 items-center">
                                            <button onClick={() => handleEditClick(player)} className="text-xs font-bold text-gray-400 uppercase hover:text-[#28D160] transition-colors flex items-center gap-1">
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <span className="text-gray-700">|</span>
                                            <a href={`/profile/${player.id}`} className="text-xs font-bold text-[#28D160] uppercase hover:text-white transition-colors">
                                                View
                                            </a>
                                            <span className="text-gray-700">|</span>
                                            <span className="text-xs font-bold text-gray-500 uppercase">
                                                {player.credits} CR
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-black/40 px-4 py-2 flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500 font-mono">Scan to view profile</span>
                                    <QrIcon size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

