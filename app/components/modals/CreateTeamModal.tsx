import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { X, Check, Search } from 'lucide-react';

export interface TeamToEdit {
    id: string;
    name: string;
    memberIds?: string[];
}

interface CreateTeamModalProps {
    coachId: string;
    teamToEdit?: TeamToEdit | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateTeamModal({ coachId, teamToEdit, onClose, onSuccess }: CreateTeamModalProps) {
    const [teamName, setTeamName] = useState(teamToEdit?.name || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Roster fetching
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(teamToEdit?.memberIds || []);
    const [fetchingProfiles, setFetchingProfiles] = useState(true);

    useEffect(() => {
        const fetchProfilesAndExistingMembers = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const response = await fetch('/api/coach/team-roster', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                
                const result = await response.json();
                if (response.ok && result.data) {
                    setProfiles(result.data);
                } else {
                    console.error('Failed to fetch team roster:', result.error);
                }

                // If editing and memberIds were not pre-passed, load existing team members
                if (teamToEdit?.id && (!teamToEdit.memberIds || teamToEdit.memberIds.length === 0)) {
                    const { data: membersData } = await supabase
                        .from('team_members')
                        .select('user_id')
                        .eq('team_id', teamToEdit.id);
                    if (membersData) {
                        setSelectedMemberIds(membersData.map((m: any) => m.user_id));
                    }
                }
            } catch (err) {
                console.error('Network error fetching team roster:', err);
            } finally {
                setFetchingProfiles(false);
            }
        };
        fetchProfilesAndExistingMembers();
    }, [coachId, teamToEdit]);

    const handleSaveTeam = async () => {
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
            if (teamToEdit?.id) {
                // Update existing team
                const { error: updateError } = await supabase
                    .from('teams')
                    .update({ name: teamName.trim(), updated_at: new Date().toISOString() })
                    .eq('id', teamToEdit.id);

                if (updateError) throw updateError;

                // Sync team members: delete removed, insert new
                const { error: delError } = await supabase
                    .from('team_members')
                    .delete()
                    .eq('team_id', teamToEdit.id);
                if (delError) throw delError;

                const memberInserts = selectedMemberIds.map(userId => ({
                    team_id: teamToEdit.id,
                    user_id: userId
                }));

                const { error: insertError } = await supabase
                    .from('team_members')
                    .insert(memberInserts);
                if (insertError) throw insertError;

                addToast(`Team "${teamName}" updated successfully!`, 'success');
            } else {
                // Create new team
                const { data: teamData, error: teamError } = await supabase
                    .from('teams')
                    .insert({ coach_id: coachId, name: teamName.trim() })
                    .select()
                    .single();

                if (teamError) throw teamError;

                const memberInserts = selectedMemberIds.map(userId => ({
                    team_id: teamData.id,
                    user_id: userId
                }));

                const { error: membersError } = await supabase
                    .from('team_members')
                    .insert(memberInserts);

                if (membersError) throw membersError;

                addToast(`Team "${teamName}" created successfully!`, 'success');
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving team:', err);
            addToast(err.message || 'Failed to save team', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (id: string) => {
        setSelectedMemberIds(prev => 
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    const filteredProfiles = profiles.filter(p => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const role = (p.role || '').toLowerCase();
        return fullName.includes(query) || role.includes(query);
    });

    const isEdit = Boolean(teamToEdit?.id);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tight text-white">
                            {isEdit ? 'Edit Team' : 'Create New Team'}
                        </h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                            {isEdit ? 'Update name and squad members' : 'Add players and parents'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto no-scrollbar space-y-5">
                    {/* Team Name */}
                    <div>
                        <label className="text-[9px] font-black text-east-light uppercase tracking-[0.2em] mb-2 block">Team Name</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g. U14 Selects"
                            className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-gray-600 focus:border-east-light/50 outline-none transition-colors"
                        />
                    </div>

                    {/* Members List with Search */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] font-black text-east-light uppercase tracking-[0.2em] block">
                                Select Members ({selectedMemberIds.length})
                            </label>
                            {selectedMemberIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedMemberIds([])}
                                    className="text-[9px] text-gray-500 hover:text-red-400 font-bold uppercase transition"
                                >
                                    Clear Selection
                                </button>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search players, parents, or roles..."
                                className="w-full bg-[#111] border border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-xs text-white placeholder:text-gray-600 focus:border-east-light/50 outline-none transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {fetchingProfiles ? (
                            <p className="text-xs text-gray-500 py-4 text-center">Loading roster...</p>
                        ) : filteredProfiles.length === 0 ? (
                            <p className="text-xs text-gray-500 py-4 text-center">
                                {searchQuery ? `No members match "${searchQuery}"` : 'No users found.'}
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar pr-1">
                                {filteredProfiles.map(p => {
                                    const isSelected = selectedMemberIds.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => toggleMember(p.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                isSelected 
                                                    ? 'bg-east-light/10 border-east-light/30 shadow-[0_0_15px_rgba(40,209,96,0.1)]' 
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
                                                isSelected ? 'bg-east-light text-black' : 'bg-black/50 border border-white/20 text-transparent'
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
                        type="button"
                        onClick={handleSaveTeam}
                        disabled={loading || !teamName.trim() || selectedMemberIds.length === 0}
                        className="w-full bg-east-light text-black font-black italic uppercase tracking-tighter py-4 rounded-xl hover:bg-[#2fe86d] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Team')}
                    </button>
                </div>
            </div>
        </div>
    );
}
