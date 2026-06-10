import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { X, Check } from 'lucide-react';

interface CreateTeamModalProps {
    coachId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateTeamModal({ coachId, onClose, onSuccess }: CreateTeamModalProps) {
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Roster fetching
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [fetchingProfiles, setFetchingProfiles] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role, avatar_url')
                .neq('role', 'sys-admin')
                .neq('id', coachId); // don't list coach to themselves

            if (!error && data) {
                setProfiles(data);
            }
            setFetchingProfiles(false);
        };
        fetchProfiles();
    }, [coachId]);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            addToast('Team name is required.', 'error');
            return;
        }
        if (selectedMemberIds.length === 0) {
            addToast('Select at least one member for the team.', 'error');
            return;
        }

        setLoading(true);
        try {
            // Create the team
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .insert({ coach_id: coachId, name: teamName.trim() })
                .select()
                .single();

            if (teamError) throw teamError;

            // Prepare team members
            const memberInserts = selectedMemberIds.map(userId => ({
                team_id: teamData.id,
                user_id: userId
            }));

            const { error: membersError } = await supabase
                .from('team_members')
                .insert(memberInserts);

            if (membersError) throw membersError;

            addToast(`Team "${teamName}" created successfully!`, 'success');
            onSuccess();
        } catch (err: any) {
            console.error('Error creating team:', err);
            addToast(err.message || 'Failed to create team', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (id: string) => {
        setSelectedMemberIds(prev => 
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Create New Team</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Add players and parents</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
                    {/* Team Name */}
                    <div>
                        <label className="text-[9px] font-black text-[#28D160] uppercase tracking-[0.2em] mb-2 block">Team Name</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g. U14 Selects"
                            className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-gray-600 focus:border-[#28D160]/50 outline-none transition-colors"
                        />
                    </div>

                    {/* Members List */}
                    <div>
                        <label className="text-[9px] font-black text-[#28D160] uppercase tracking-[0.2em] mb-2 block">
                            Select Members ({selectedMemberIds.length})
                        </label>
                        {fetchingProfiles ? (
                            <p className="text-xs text-gray-500">Loading roster...</p>
                        ) : profiles.length === 0 ? (
                            <p className="text-xs text-gray-500">No users found.</p>
                        ) : (
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                                {profiles.map(p => {
                                    const isSelected = selectedMemberIds.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleMember(p.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                isSelected 
                                                    ? 'bg-[#28D160]/10 border-[#28D160]/30 shadow-[0_0_15px_rgba(40,209,96,0.1)]' 
                                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                                                    {p.avatar_url ? (
                                                        <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#111] border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500">
                                                            {p.full_name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <span className="block text-xs font-black text-white uppercase">{`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown User'}</span>
                                                    <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">{p.role}</span>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                                isSelected ? 'bg-[#28D160] text-black' : 'bg-black/50 border border-white/20 text-transparent'
                                            }`}>
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/5 bg-gradient-to-t from-[#0a0a0a] to-transparent">
                    <button
                        onClick={handleCreateTeam}
                        disabled={loading || !teamName.trim() || selectedMemberIds.length === 0}
                        className="w-full bg-[#28D160] text-black font-black italic uppercase tracking-tighter py-4 rounded-xl hover:bg-[#2fe86d] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Creating...' : 'Create Team'}
                    </button>
                </div>
            </div>
        </div>
    );
}
