'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Search, QrCode as QrIcon, Trash2, Edit2, Shield } from 'lucide-react';
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
        team: '',
        position: ''
    });

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        setLoading(true);
        // Assuming 'profiles' table holds players. We might filter by role if it existed, 
        // but for now we'll just fetch all or filter by a convention if needed.
        // The user mentioned "Add players".
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            // .eq('role', 'player') // Uncomment if role column exists and is populated
            .order('created_at', { ascending: false });

        if (data) {
            setPlayers(data);
        }
        setLoading(false);
    };

    const handleAddPlayer = async () => {
        if (!newPlayer.first_name || !newPlayer.last_name || !newPlayer.team) return alert("Please fill required fields");

        const tempId = crypto.randomUUID(); // Generate a ID for the profile

        // Note: Creating a profile without an auth user is valid if RLS allows it.
        // This profile can later be 'claimed' or just used as a roster entry.
        const { error } = await supabase.from('profiles').insert({
            id: tempId,
            name: newPlayer.first_name, // Mapping to existing schema 'name'
            surname: newPlayer.last_name, // Mapping to existing schema 'surname'
            role: 'player', // Explicitly setting role
            team: newPlayer.team, // Assuming this column exists or we might store in metadata
            // position: newPlayer.position,
            // bio: '',
        });

        if (error) {
            alert('Error adding player: ' + error.message);
        } else {
            alert('Player added successfully');
            setShowAddForm(false);
            setNewPlayer({ first_name: '', last_name: '', team: '', position: '' });
            fetchPlayers();
        }
    };

    const filteredPlayers = players.filter(p =>
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team?.toLowerCase().includes(searchTerm.toLowerCase()))
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
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Team</label>
                                <input
                                    value={newPlayer.team}
                                    onChange={e => setNewPlayer({ ...newPlayer, team: e.target.value })}
                                    placeholder="e.g. Rhinos"
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleAddPlayer} className="flex-1 bg-[#28D160] text-black font-bold py-2 rounded uppercase text-xs hover:bg-white">Save Player</button>
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
                                            <h3 className="font-bold text-white truncate pr-2">{player.name} {player.surname}</h3>
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 uppercase shrink-0">
                                                {player.team || 'No Team'}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs truncate mt-1">ID: {player.id}</p>

                                        <div className="mt-auto flex gap-2 pt-2">
                                            <button className="text-xs font-bold text-[#28D160] uppercase hover:text-white transition-colors">
                                                Edit
                                            </button>
                                            <span className="text-gray-700">|</span>
                                            <button className="text-xs font-bold text-gray-500 uppercase hover:text-red-500 transition-colors">
                                                Delete
                                            </button>
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
