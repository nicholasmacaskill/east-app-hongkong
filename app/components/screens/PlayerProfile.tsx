import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Edit2, Activity, Award, Camera, Coins, Trophy, Sparkles } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '../ui/Toast';
import { compressImage } from '@/app/lib/image-utils';
import Link from 'next/link';
import { SPORT_CATEGORIES, CATEGORY_LABELS, normalizeCategory, getDisplayStatGroups } from '@/app/lib/statFields';
import StatDisplayList from '@/app/components/ui/StatDisplayList';
import { useTenant } from '@/app/providers/TenantProvider';
import HockeyCard from '@/app/components/ui/HockeyCard';
import { HockeyCardCareerTotals, PlayerHockeyStat } from '@/app/types/stats';

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
  const [activeTab, setActiveTab] = useState<'card' | 'streaks' | 'full_stats'>('card');
  const [categoryStats, setCategoryStats] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [checkInCount, setCheckInCount] = useState<number | null>(null);
  const [hockeyStats, setHockeyStats] = useState<PlayerHockeyStat[]>([]);
  const [careerTotals, setCareerTotals] = useState<HockeyCardCareerTotals | null>(null);
  const [loadingHockeyStats, setLoadingHockeyStats] = useState(true);

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

    const fetchHockeyStats = async () => {
      if (!profileData?.id) return;
      try {
        setLoadingHockeyStats(true);
        const res = await fetch(`/api/hockey-stats/${profileData.id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.stats) setHockeyStats(json.stats);
          if (json.careerTotals) setCareerTotals(json.careerTotals);
        }
      } catch (err) {
        console.error('Error fetching hockey stats:', err);
      } finally {
        setLoadingHockeyStats(false);
      }
    };

    fetchAllStats();
    fetchCheckIns();
    fetchHockeyStats();
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
  const { tenant } = useTenant();

  return (
    <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden font-montserrat">

      {/* Background Image Layer - Premium Blur Overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <Image
          src={tenant.assets.bannerUrl || tenant.assets.logoUrl}
          className="object-cover opacity-20 grayscale scale-110"
          fill
          alt="Premium background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/95" />
      </div>

      <div className="relative z-10 w-full mx-auto px-4">
        <div className="flex flex-col pt-4">
          {/* PROFILE INFO HEADER */}
          <div className="w-full relative">
            {!isReadOnly && (
              <div className="absolute top-2 right-2 z-30">
                <button data-testid="settings-button" onClick={onOpenSettings} className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-colors border border-white/10">
                  <Edit2 size={16} className="text-gray-400" />
                </button>
              </div>
            )}

            {/* Split Header Row (Avatar Left, Info Right) */}
            <div className="flex items-center gap-4 w-full pt-4">
              {/* Left: Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`w-32 h-32 rounded-full border-4 border-white/10 bg-white/5 overflow-hidden shadow-xl backdrop-blur-sm relative ${isReadOnly ? '' : 'cursor-pointer group'}`}
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
                        <div className="w-6 h-6 border-3 border-east-light border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={24} className="text-white" />
                      )}
                    </div>
                  )}
                </div>
                <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
              </div>

              {/* Right: Name, Username, Metadata pills */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h2 className="font-black italic text-xl text-white uppercase tracking-tight truncate">
                  {profileData.name || 'PLAYER'} <span className="text-east-light">{profileData.surname || 'ELITE'}</span>
                </h2>
                {profileData.username && (
                  <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">@{profileData.username}</p>
                )}

                {/* Inline Metadata Pills */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[7px] font-black text-east-light bg-east-light/10 border border-east-light/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    DIVISION: {hockeyStats[0]?.division || (profileData.team?.includes('U11') ? 'U11' : profileData.team?.includes('U13') ? 'U13' : profileData.team?.includes('U15') ? 'U15' : profileData.team?.includes('U17') ? 'U17' : profileData.team?.includes('U18') ? 'U18' : 'ELITE')}
                  </span>
                  <span className="text-[7px] font-black text-east-light bg-east-light/10 border border-east-light/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SEASON: {hockeyStats[0]?.season || '2024-25'}
                  </span>
                  <span className="text-[7px] font-black text-east-light bg-east-light/10 border border-east-light/20 px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[140px]">
                    TEAM: {profileData.team || hockeyStats[0]?.team_name || 'EAST Stars'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Block */}
            {profileData.bio && (
              <div className="mt-3 px-2 border-l-2 border-east-light/40 pl-3">
                <p className="text-white/70 text-[11px] font-medium italic leading-relaxed">
                  "{profileData.bio}"
                </p>
              </div>
            )}

            {/* Divider and Horizontal Badge Row */}
            <div className="w-full h-px bg-white/5 my-3" />
            <div className="flex items-center justify-between w-full gap-1">
              {[
                { l: 'CREDITS', v: profileData.credits || 0, icon: Coins, action: onShowHistory },
                { l: 'VISITS', v: checkInCount !== null ? checkInCount : '-', icon: Activity },
                { l: 'GOALS', v: careerTotals?.total_goals ?? (hockeyStats[0]?.goals ?? 0), icon: Award },
                { l: 'POINTS', v: careerTotals?.total_points ?? (hockeyStats[0]?.points ?? 0), icon: Award },
              ].map((badge: any, i) => (
                <div
                  key={i}
                  onClick={badge.action}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                    badge.action ? 'cursor-pointer hover:scale-105 group' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border border-east-light/20 bg-white/5 flex items-center justify-center mb-1.5 shadow-md group-hover:border-east-light/40 transition-colors">
                    <badge.icon size={18} className="text-east-light drop-shadow-md" />
                  </div>
                  <span className="font-black text-sm text-white italic leading-none">{badge.v}</span>
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mt-1 text-center truncate w-full">
                    {badge.l}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full h-px bg-white/5 mt-3 mb-6" />
          </div>

          {/* PERFORMANCE AREA */}
          <div className="w-full mt-2">
            {/* View Switcher Tabs: Hockey Card vs Combines/Testing */}
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`flex-1 py-2.5 rounded-xl font-black italic text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'card'
                    ? 'bg-east-light text-black shadow-lg shadow-east-light/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>🏒 HOCKEY CARD</span>
                {hockeyStats.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/30 font-bold">
                    {hockeyStats.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('full_stats')}
                className={`flex-1 py-2.5 rounded-xl font-black italic text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'full_stats'
                    ? 'bg-east-light text-black shadow-lg shadow-east-light/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>📊 COMBINES & TESTING</span>
              </button>
            </div>

            {/* TAB 1: THE DIGITAL HOCKEY CARD */}
            {activeTab === 'card' && (
              <div className="flex flex-col items-center animate-fadeIn mb-8">
                <HockeyCard
                  player={{
                    id: profileData.id,
                    first_name: profileData.name || 'Player',
                    last_name: profileData.surname || 'Elite',
                    username: profileData.username,
                    avatar_url: profileData.avatar_url,
                    team: profileData.team,
                  }}
                  hockeyStats={hockeyStats}
                  careerTotals={careerTotals}
                  isLoading={loadingHockeyStats}
                />
              </div>
            )}

            {/* TAB 2: COMBINES & TESTING STATS */}
            {activeTab === 'full_stats' && (
              <div className="flex flex-col gap-8 animate-fadeIn">
                <Link
                  href="/stats"
                  data-testid="leaderboard-search-link"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-white/10 bg-white/5 hover:border-east-light/50 hover:bg-east-light/10 transition-colors"
                >
                  <Trophy size={16} className="text-east-light" />
                  <span className="font-black italic text-[10px] text-white uppercase tracking-widest">
                    Search Players & Leaderboard
                  </span>
                </Link>

                {SPORT_CATEGORIES.some(
                  (cat) =>
                    categoryStats[cat] &&
                    Object.keys(categoryStats[cat]).filter(
                      (k) => categoryStats[cat][k] !== '' && categoryStats[cat][k] !== null
                    ).length > 0
                ) ? (
                  SPORT_CATEGORIES.map((cat) => {
                    const stats = categoryStats[cat];
                    if (
                      !stats ||
                      Object.keys(stats).filter((k) => stats[k] !== '' && stats[k] !== null).length === 0
                    )
                      return null;

                    const { subtitle, groups } = getDisplayStatGroups(cat, stats);
                    if (groups.length === 0) return null;

                    return (
                      <StatDisplayList
                        key={cat}
                        categoryLabel={CATEGORY_LABELS[cat] || cat}
                        subtitle={subtitle}
                        groups={groups}
                      />
                    );
                  })
                ) : (
                  <div className="text-center p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl">
                    <Award size={32} className="mx-auto text-white/20 mb-3" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      No facility combine tests recorded yet
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}