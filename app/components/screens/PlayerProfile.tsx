import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Edit2, Activity, Award, Camera, Coins, Trophy } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '../ui/Toast';
import { compressImage } from '@/app/lib/image-utils';
import Link from 'next/link';
import { STAT_FIELDS, SPORT_CATEGORIES, normalizeCategory } from '@/app/lib/statFields';

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
  const [categoryStats, setCategoryStats] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [checkInCount, setCheckInCount] = useState<number | null>(null);

  // Removed gallery state and refs
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAllStats = async () => {
      if (!profileData?.id) return;

      try {
        const { data: psData, error: psError } = await supabase
          .from('players_stats')
          .select('*')
          .eq('player_id', profileData.id);

        if (psData && psData.length > 0) {
          const statsMap: Record<string, any> = {};
          psData.forEach(row => {
            const category = normalizeCategory(row.category) || row.category?.toUpperCase();
            if (!category) return;
            statsMap[category] = row.stats || row;
          });
          setCategoryStats(statsMap);
        } else {
          // Fallback check for golf_stats table if needed, though modern approach uses players_stats
          const { data: gData } = await supabase
            .from('golf_stats')
            .select('*')
            .eq('player_id', profileData.id)
            .single();
          
          if (gData) {
            setCategoryStats({
              GOLF: {
                handicap: gData.handicap || 0,
                longest_drive: gData.driver_distance || 0,
                closest_to_pin: gData.closest_to_pin || 0,
                average_score: gData.average_score || 0
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching player stats:', err);
      }
    };

    const fetchCheckIns = async () => {
      if (!profileData?.id) return;
      try {
        const { count, error } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileData.id);
          
        if (!error) {
          setCheckInCount(count !== null ? count : 0);
        } else {
          setCheckInCount(0);
        }
      } catch (err) {
        setCheckInCount(0);
      }
    };

    fetchAllStats();
    fetchCheckIns();
  }, [profileData?.id, initialStats]);


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
        <Image
          src="https://images.unsplash.com/photo-1541534741688-6078c64b550d?auto=format&fit=crop&q=80&w=1200"
          className="object-cover opacity-20 grayscale scale-110"
          fill
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
                    <Image
                      src={profileData.avatar_url || "https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg"}
                      className={`object-cover transition-opacity ${isReadOnly ? '' : 'group-hover:opacity-40'} ${uploading ? 'opacity-20' : 'opacity-90'}`}
                      fill
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
                    { l: 'GYM VISITS', l2: 'LIFETIME', v: checkInCount !== null ? checkInCount : '-', icon: Activity },
                    { l: 'TOP SCORER', l2: '(TEAM)', v: 'soon', icon: Award },
                    { l: 'MOST SHOTS', l2: '(TEAM)', v: 'soon', icon: Award },
                  ].map((badge: any, i) => (
                    <div
                      key={i}
                      onClick={badge.action}
                      className={`flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#28D160]/50 transition-colors ${badge.action ? 'cursor-pointer' : ''} min-h-[90px] justify-center`}
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

              {/* 3. METADATA BANNER */}
              <div className="w-full bg-black/60 backdrop-blur-xl py-5 px-2 grid grid-cols-3 gap-1 shadow-2xl border-y border-white/5 relative z-30 mb-8 mt-4 rounded-xl group hover:border-[#28D160]/30 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-r from-[#28D160]/5 via-transparent to-[#28D160]/5 opacity-50 rounded-xl" />
                <div className="flex flex-col items-center justify-center border-r border-white/10 relative z-10">
                  <div className="font-black italic text-[9px] text-[#28D160] tracking-widest uppercase mb-1">AGE</div>
                  <span className="text-[10px] text-white font-black italic lowercase leading-none drop-shadow-md">soon</span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-white/10 relative z-10">
                  <div className="font-black italic text-[9px] text-[#28D160] tracking-widest uppercase mb-1">SEASON</div>
                  <span className="text-[10px] text-white font-black italic lowercase leading-none drop-shadow-md">soon</span>
                </div>
                <div className="flex flex-col items-center justify-center relative z-10">
                  <div className="font-black italic text-[9px] text-[#28D160] tracking-widest uppercase mb-1">TEAM</div>
                  <span className="text-[10px] text-white font-black italic lowercase leading-none drop-shadow-md">soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* PERFORMANCE AREA */}
          <div className="w-full mt-4">
            <Link
              href="/stats"
              data-testid="leaderboard-search-link"
              className="mb-6 flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-white/10 bg-white/5 hover:border-[#28D160]/50 hover:bg-[#28D160]/10 transition-colors"
            >
              <Trophy size={16} className="text-[#28D160]" />
              <span className="font-black italic text-[10px] text-white uppercase tracking-widest">Search Players & Leaderboard</span>
            </Link>
            <div className="flex flex-col gap-10 animate-fadeIn">
              {SPORT_CATEGORIES.some(cat => categoryStats[cat] && Object.keys(categoryStats[cat]).filter(k => categoryStats[cat][k] !== '' && categoryStats[cat][k] !== null).length > 0) ? (
                SPORT_CATEGORIES.map((cat) => {
                  const stats = categoryStats[cat];
                  if (!stats || Object.keys(stats).filter(k => stats[k] !== '' && stats[k] !== null).length === 0) return null;

                  return (
                    <div key={cat} className="flex flex-col gap-3">
                      <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest text-center">{cat} PERFORMANCE</h3>
                      <div className="bg-gradient-to-r from-[#28D160]/50 to-[#1a8e41]/50 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <div className="grid grid-cols-2">
                          {(() => {
                            const activeFields = STAT_FIELDS[cat].filter((field: any) => {
                                const val = stats[field.key];
                                return val !== undefined && val !== null && val !== '';
                            });

                            return activeFields.map((field: any, index: number) => {
                                const val = stats[field.key];
                                return (
                                  <div key={field.key} className={`flex flex-col items-center justify-center p-4 gap-1 hover:bg-white/5 transition-colors border-white/10 ${index % 2 === 0 ? 'border-r' : ''} border-b last:border-b-0`}>
                                    <span className="font-black text-[8px] tracking-wider text-white/80 uppercase text-center">{field.label}</span>
                                    <span className="font-black text-lg text-white italic">{val} <span className="text-[10px] text-white/50 not-italic">{field.unit}</span></span>
                                  </div>
                                );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })
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