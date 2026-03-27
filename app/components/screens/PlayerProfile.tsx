import React, { useState, useEffect } from 'react';
import { Edit2, Activity, Award, Camera, Coins } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '../ui/Toast';
import { compressImage } from '@/app/lib/image-utils';

// Simple Card Wrapper
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl ${className}`}>
    {children}
  </div>
);

const STAT_FIELDS: Record<string, any[]> = {
  GOLF: [
    { key: 'handicap', label: 'Handicap', type: 'number', unit: '' },
    { key: 'longest_drive', label: 'Longest Drive', type: 'number', unit: 'yds' },
    { key: 'closest_to_pin', label: 'Closest to Pin', type: 'number', unit: 'ft' },
    { key: 'league_wins', label: 'League Wins', type: 'number', unit: '' },
    { key: 'tournament_wins', label: 'Tournament Wins', type: 'number', unit: '' },
    { key: 'average_score', label: 'Average Score', type: 'number', unit: '' }
  ],
  HYROX: [
    { key: 'run_1km', label: '1KM Run Time', type: 'time', unit: 'mm:ss' },
    { key: 'ski_erg_1000m', label: 'Ski Erg: 1,000m', type: 'time', unit: 'mm:ss' },
    { key: 'sled_push_50m', label: 'Sled Push: 50m', type: 'time', unit: 'mm:ss' },
    { key: 'sled_pull_50m', label: 'Sled Pull: 50m', type: 'time', unit: 'mm:ss' },
    { key: 'burpee_broad_jumps_80m', label: 'Burpee Broad Jumps: 80m', type: 'time', unit: 'mm:ss' },
    { key: 'row_1000m', label: 'Row: 1,000m', type: 'time', unit: 'mm:ss' },
    { key: 'farmers_carry_200m', label: 'Farmer\'s Carry: 200m', type: 'time', unit: 'mm:ss' },
    { key: 'sandbag_lunges_100m', label: 'Sandbag Lunges: 100m', type: 'time', unit: 'mm:ss' },
    { key: 'wall_balls_100', label: 'Wall Balls: 100 reps', type: 'time', unit: 'mm:ss' }
  ],
  HOCKEY: [
    { key: 'react_targets', label: 'React Targets', type: 'time', unit: 'mm:ss' },
    { key: 'classic_targets', label: 'Classic Targets', type: 'number', unit: '' }
  ]
};

type PlayerStats = Record<string, any>;

export interface PlayerProfileProps {
  onOpenSettings: () => void;
  profileData: any;
  stats?: PlayerStats;
  isReadOnly?: boolean;
  onRefresh?: () => void;
  onShowHistory?: () => void;
}

export default function PlayerProfile({ onOpenSettings, profileData, stats: initialStats, isReadOnly = false, onRefresh, onShowHistory }: PlayerProfileProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'streaks' | 'full_stats'>('streaks');
  const [stats, setStats] = useState<PlayerStats | null>(initialStats || null);
  const [uploading, setUploading] = useState(false);

  // Removed gallery state and refs
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Determine sport from bio or props
  const sport = profileData?.bio?.toUpperCase().includes('GOLF') ? 'GOLF' :
    profileData?.bio?.toUpperCase().includes('HOCKEY') ? 'HOCKEY' :
      profileData?.bio?.toUpperCase().includes('HYROX') ? 'HYROX' : 'GENERAL';

  useEffect(() => {
    const fetchStats = async () => {
      if (!profileData?.id) return;

      try {
        // Fetch from players_stats first (Modern flexible approach)
        const { data: psData, error: psError } = await supabase
          .from('players_stats')
          .select('*')
          .eq('player_id', profileData.id)
          .eq('category', sport)
          .single();

        if (psData) {
          // If using JSONB stats column
          const finalStats = psData.stats || psData; // Support both flat and JSONB
          setStats(finalStats);
          return;
        }

        // Fallback for Golf if handled separately
        if (sport === 'GOLF') {
          const { data: gData } = await supabase
            .from('golf_stats')
            .select('*')
            .eq('player_id', profileData.id)
            .single();
          if (gData) {
            setStats({
              age: 31, // Placeholder as age isn't in golf_stats
              season: 2026,
              team: profileData.team || 'INDEPENDENT',
              average_score: gData.average_score || 0,
              longest_drive: gData.driver_distance || 0,
              handicap: gData.handicap || 0,
              closest_to_pin: gData.closest_to_pin || 0,
              league_wins: gData.league_wins || 0,
              tournament_wins: gData.tournament_wins || 0
            });
            return;
          }
        }

        // Default mock if nothing found
        if (!initialStats) {
          setStats({});
        }
      } catch (err) {
        console.error('Error fetching player stats:', err);
      }
    };

    fetchStats();
  }, [profileData?.id, sport, initialStats]);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const originalFile = e.target.files[0];
    setUploading(true);

    try {
      // Compress image before upload
      const file = await compressImage(originalFile);

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${profileData.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profileData.id);

      if (dbError) {
        throw new Error(`Profile update failed: ${dbError.message}`);
      }

      addToast('Avatar updated!', 'success');
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      addToast(error.message || 'Avatar upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Safety Check
  if (!profileData) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-montserrat font-bold animate-pulse uppercase tracking-widest">Loading Player Profile...</div>;

  return (
    <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden font-montserrat">

      {/* Background Image Layer - Premium Blur Overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541534741688-6078c64b550d?auto=format&fit=crop&q=80&w=1200"
          className="w-full h-full object-cover opacity-20 grayscale scale-110"
          alt="Premium background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/95" />
      </div>

      <div className="relative z-10 w-full mx-auto px-4">
        <div className="flex flex-col pt-8">
          {/* PROFILE INFO HEADER */}
          <div className="w-full">
            {/* HEADER CONTAINER */}
            <div className="flex flex-col">
              {/* 1. TOP VISUALS */}
              <div className="relative h-[250px] w-full shrink-0">
                {!isReadOnly && (
                  <div className="absolute top-4 right-6 z-30 flex gap-2">
                    <button data-testid="settings-button" onClick={onOpenSettings} className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-colors border border-white/10">
                      <Edit2 size={20} className="text-gray-400" />
                    </button>
                  </div>
                )}

                <div className="absolute left-6 top-16 z-10">
                  <div
                    className={`w-44 h-44 rounded-full border-[6px] border-white/10 bg-white/5 overflow-hidden shadow-2xl backdrop-blur-sm relative ${isReadOnly ? '' : 'cursor-pointer group'}`}
                    onClick={(e) => {
                      if (!isReadOnly) {
                        e.stopPropagation();
                        avatarInputRef.current?.click();
                      }
                    }}
                  >
                    <img
                      src={profileData.avatar_url || "https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg"}
                      className={`w-full h-full object-cover transition-opacity ${isReadOnly ? '' : 'group-hover:opacity-40'} ${uploading ? 'opacity-20' : 'opacity-90'}`}
                      alt="profile"
                    />
                    {!isReadOnly && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? (
                          <div className="w-8 h-8 border-4 border-east-light border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera size={32} className="text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
                </div>
              </div>

              {/* 2. MIDDLE CONTENT */}
              <div className="px-6 pb-8 flex flex-col gap-8 items-center w-full mt-4">
                <div className="w-full flex flex-col items-center pt-2">
                  <h2 className="font-black italic text-2xl text-white uppercase tracking-tighter leading-tight text-center">
                    {profileData.name || 'PLAYER'} <span className="text-east-light">{profileData.surname || 'ELITE'}</span>
                  </h2>
                  {profileData.username && (
                    <p className="font-bold text-xs text-gray-500 uppercase tracking-widest mt-2">@{profileData.username}</p>
                  )}
                </div>

                {/* Bio Section */}
                {profileData.bio && (
                  <div className="w-full bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl relative z-20 text-center">
                    <p className="text-white text-xs font-bold italic leading-relaxed opacity-90">"{profileData.bio}"</p>
                  </div>
                )}

                <div className="grid grid-cols-2 w-full gap-3 mt-2">
                  {[
                    { l: 'CREDITS', l2: 'AVAILABLE', v: profileData.credits || 0, icon: Coins, action: onShowHistory },
                    { l: 'TOP SCORER', l2: '(TEAM)', v: 'soon', icon: Award },
                    { l: 'MOST SHOTS', l2: '(TEAM)', v: 'soon', icon: Award },
                  ].map((badge: any, i) => (
                    <div
                      key={i}
                      onClick={badge.action}
                      className={`flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#28D160]/50 transition-colors ${badge.action ? 'cursor-pointer' : ''} min-h-[90px] justify-center ${i === 2 ? 'col-span-2' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full border border-east-light/30 bg-black/40 flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        <badge.icon size={20} className="text-[#28D160] drop-shadow-md" />
                      </div>
                      {badge.v === 'soon' ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[8px] font-black uppercase text-center leading-none text-gray-400 group-hover:text-white transition-colors">{badge.l}</span>
                          <span className="text-[8px] font-black uppercase text-center leading-none text-gray-400 group-hover:text-white transition-colors mb-1">{badge.l2}</span>
                          <span className="text-[9px] text-white/40 lowercase italic leading-none">{badge.v}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-xl text-white italic leading-none">{badge.v}</span>
                          <span className="text-[8px] font-black uppercase text-center leading-none text-gray-400 group-hover:text-white transition-colors mt-1">{badge.l}</span>
                          <span className="text-[8px] font-black uppercase text-center leading-none text-gray-400 group-hover:text-white transition-colors">{badge.l2}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. COLORED BANNER */}
              <div className="w-full bg-gradient-to-r from-[#28D160] to-[#1a8e41] py-4 px-2 grid grid-cols-3 gap-1 shadow-lg border-y border-white/10 relative z-30 mb-8 mt-4 rounded-xl">
                <div className="flex flex-col items-center justify-center border-r border-black/10">
                  <div className="font-black italic text-[9px] text-black tracking-widest uppercase mb-0.5">AGE</div>
                  <span className="text-[9px] text-black/60 font-black italic lowercase leading-none">soon</span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-black/10">
                  <div className="font-black italic text-[9px] text-black tracking-widest uppercase mb-0.5">SEASON</div>
                  <span className="text-[9px] text-black/60 font-black italic lowercase leading-none">soon</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="font-black italic text-[9px] text-black tracking-widest uppercase mb-0.5">TEAM</div>
                  <span className="text-[9px] text-black/60 font-black italic lowercase leading-none">soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* PERFORMANCE AREA */}
          <div className="w-full mt-4">
            <div className="flex flex-col gap-6 animate-fadeIn">
              {STAT_FIELDS[sport] && stats && Object.keys(stats).filter(k => stats[k] !== '' && stats[k] !== null).length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest text-center">{sport} PERFORMANCE</h3>
                  <div className="bg-gradient-to-r from-[#28D160]/50 to-[#1a8e41]/50 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <div className="grid grid-cols-2">
                      {STAT_FIELDS[sport].map((field: any, index: number) => {
                        const val = stats?.[field.key];
                        if (val === undefined || val === null || val === '') return null;

                        return (
                          <div key={field.key} className={`flex flex-col items-center justify-center p-4 gap-1 hover:bg-white/5 transition-colors border-white/10 ${index % 2 === 0 ? 'border-r' : ''} border-b`}>
                            <span className="font-black text-[8px] tracking-wider text-white/80 uppercase text-center">{field.label}</span>
                            <span className="font-black text-lg text-white italic">{val} <span className="text-[10px] text-white/50 not-italic">{field.unit}</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl">
                  <Award size={32} className="mx-auto text-white/20 mb-3" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No stats verified yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}