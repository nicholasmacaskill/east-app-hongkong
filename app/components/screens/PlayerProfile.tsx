'use client';
import React, { useState, useEffect } from 'react';
import { Edit2, Trophy, Target, Shield, Users, Activity, Award, ChevronRight, Image as ImageIcon, Camera } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useGallery } from '@/app/hooks/useGallery';
import Lightbox from '@/app/components/ui/Lightbox';

// Simple Card Wrapper
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl ${className}`}>
    {children}
  </div>
);

interface PlayerStats {
  age: number; season: number; team: string;
  games_played_season: number; games_played_total: number;
  games_missed_healthy: number; games_missed_injured: number;
  goals_season: number; goals_total: number;
  assists_season: number; assists_total: number;
}

interface PlayerProfileProps {
  onOpenSettings: () => void;
  profileData: any;
  stats?: PlayerStats;
  isReadOnly?: boolean;
}

export default function PlayerProfile({ onOpenSettings, profileData, stats: initialStats, isReadOnly = false }: PlayerProfileProps) {
  const [activeTab, setActiveTab] = useState<'streaks' | 'full_stats' | 'news' | 'gallery'>('streaks');
  const [stats, setStats] = useState<PlayerStats | null>(initialStats || null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const displayGallery = profileData.gallery_images && profileData.gallery_images.length > 0
    ? profileData.gallery_images
    : [
      "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1518407613690-d9fc996e74bc?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400",
    ];

  const gallery = useGallery(displayGallery);

  // Safety Check
  if (!profileData) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-montserrat font-bold animate-pulse uppercase tracking-widest">Loading Player Profile...</div>;

  useEffect(() => {
    // Only load default mock data if no stats were provided
    if (!initialStats) {
      setStats({
        age: 31, season: 3, team: 'RHINOS',
        games_played_season: 12, games_played_total: 45, games_missed_healthy: 0, games_missed_injured: 2,
        goals_season: 5, goals_total: 22, assists_season: 8, assists_total: 30
      });
    }
  }, [initialStats]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingGallery(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `gallery-${profileData.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploadingGallery(false);
      return;
    }

    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
    const newImageUrl = data.publicUrl;

    const updatedGallery = [...(profileData.gallery_images || []), newImageUrl];
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ gallery_images: updatedGallery })
      .eq('id', profileData.id);

    if (!dbError) {
      alert('Photo added to gallery!');
      window.location.reload();
    } else {
      alert('Failed to update profile: ' + dbError.message);
    }
    setUploadingGallery(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingGallery(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${profileData.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

    if (uploadError) {
      alert('Avatar upload failed');
      setUploadingGallery(false);
      return;
    }

    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', profileData.id);

    if (!dbError) {
      alert('Avatar updated!');
      window.location.reload();
    }
    setUploadingGallery(false);
  };

  return (
    <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden font-montserrat">

      {/* Background Image Layer - Premium Blur Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
          className="w-full h-full object-cover opacity-20 grayscale"
          alt="bg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* HEADER CONTAINER */}
        <div className="flex flex-col">
          {/* 1. TOP VISUALS */}
          <div className="relative h-[250px] w-full shrink-0">
            {!isReadOnly && (
              <button onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
                <Edit2 size={24} />
              </button>
            )}

            <div className="absolute right-8 top-20 z-0 opacity-20">
              <h1 className="font-black italic text-[8rem] text-white leading-none tracking-tighter select-none uppercase">#12</h1>
            </div>

            <div className="absolute left-6 top-16 z-10">
              <div
                className={`w-44 h-44 rounded-full border-[6px] border-white/10 bg-white/5 overflow-hidden shadow-2xl backdrop-blur-sm relative ${isReadOnly ? '' : 'cursor-pointer group'}`}
                onClick={() => !isReadOnly && avatarInputRef.current?.click()}
              >
                <img
                  src={profileData.avatar_url || "https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg"}
                  className={`w-full h-full object-cover opacity-90 transition-opacity ${isReadOnly ? '' : 'group-hover:opacity-40'}`}
                  alt="profile"
                />
                {!isReadOnly && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={32} className="text-white" />
                  </div>
                )}
              </div>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            </div>
          </div>

          {/* 2. MIDDLE CONTENT */}
          <div className="px-6 pb-8 flex flex-col gap-6 items-center w-full -mt-2">
            <div className="w-full flex flex-col items-center pt-8">
              <h2 className="font-black italic text-2xl text-white uppercase tracking-tighter leading-none text-center">
                {profileData.name || 'PLAYER'} <span className="text-east-light">{profileData.surname || 'ELITE'}</span>
              </h2>
              {profileData.username && (
                <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-1">@{profileData.username}</p>
              )}
            </div>

            {/* Bio Section */}
            {profileData.bio && (
              <div className="w-full bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl relative z-20 text-center">
                <p className="text-white text-xs font-bold italic leading-relaxed opacity-90">"{profileData.bio}"</p>
              </div>
            )}

            <div className="grid grid-cols-3 w-full gap-2">
              {[
                { l: 'TOP SCORER\n(TEAM)', icon: Award },
                { l: 'TOP SCORER\n(LEAGUE)', icon: Award },
                { l: 'MOST SHOTS\n(TEAM)', icon: Award },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/10 group hover:border-east-light/50 transition-colors">
                  <div className="w-10 h-10 rounded-full border border-east-light/30 bg-black/40 flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform p-1">
                    <badge.icon size={20} className="text-white drop-shadow-md" />
                  </div>
                  <span className="text-[7px] font-black uppercase text-center leading-tight text-gray-400 whitespace-pre-line group-hover:text-white transition-colors">{badge.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. COLORED BANNER */}
          <div className="w-full bg-gradient-to-r from-east-light to-east-dark py-4 px-8 flex justify-between items-center shadow-lg border-y border-white/10 relative z-30">
            <div className="text-center">
              <div className="font-black italic text-[10px] text-black/60 tracking-widest uppercase">AGE</div>
              <div className="font-black text-xl text-white mt-0.5 italic uppercase">{stats?.age || '31'}</div>
            </div>
            <div className="text-center">
              <div className="font-black italic text-[10px] text-black/60 tracking-widest uppercase">SEASON</div>
              <div className="font-black text-xl text-white mt-0.5 italic uppercase">{stats?.season || '3'}</div>
            </div>
            <div className="text-center">
              <div className="font-black italic text-[10px] text-black/60 tracking-widest uppercase">TEAM</div>
              <div className="font-black text-xl text-white mt-0.5 italic uppercase">{stats?.team || 'RHINOS'}</div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex justify-center gap-6 py-6 relative z-20 overflow-x-auto no-scrollbar px-4">
          {['STREAKS', 'FULL STATS', 'NEWS', 'GALLERY'].map(tab => {
            const tabKey = tab.toLowerCase().replace(' ', '_') as any;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey)}
                className={`font-black italic text-xs uppercase transition-all drop-shadow-lg whitespace-nowrap ${activeTab === tabKey ? 'text-white border-b-2 border-east-light pb-1' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* CONTENT AREA */}
        <div className="px-4 pb-24 w-full">
          {/* STREAKS TAB */}
          {activeTab === 'streaks' && (
            <div className="flex flex-col gap-8 animate-fadeIn">
              {/* GAMES ROW - Restored Labels */}
              <div className="flex flex-col gap-3">
                <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest px-2 text-center">GAMES</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <div className="grid grid-cols-2">
                    {[
                      { label: "GAMES PLAYED (SEASON)", value: stats?.games_played_season || 0 },
                      { label: "GAMES PLAYED (TOTAL)", value: stats?.games_played_total || 0 },
                      { label: "GAMES MISSED (HEALTHY)", value: stats?.games_missed_healthy || 0 },
                      { label: "GAMES MISSED (INJURED)", value: stats?.games_missed_injured || 0 }
                    ].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b border-white/10' : ''}`}>
                        <span className="font-black text-[8px] tracking-wider text-white/80 uppercase text-center">{item.label}</span>
                        <span className="font-black text-2xl text-white italic">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* POINTS ROW - Restored Labels */}
              <div className="flex flex-col gap-3">
                <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest px-2 text-center">POINTS</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <div className="grid grid-cols-2">
                    {[
                      { label: "GOALS (SEASON)", value: stats?.goals_season || 0 },
                      { label: "GOALS (TOTAL)", value: stats?.goals_total || 0 },
                      { label: "ASSISTS (SEASON)", value: stats?.assists_season || 0 },
                      { label: "ASSISTS (TOTAL)", value: stats?.assists_total || 0 }
                    ].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b border-white/10' : ''}`}>
                        <span className="font-black text-[8px] tracking-wider text-white/80 uppercase text-center">{item.label}</span>
                        <span className="font-black text-2xl text-white italic">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MILESTONES ROW - Restored Labels */}
              <div className="flex flex-col gap-3">
                <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest px-2 text-center">MILESTONES</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <div className="grid grid-cols-2">
                    {[
                      { label: "TOP SCORER (TEAM)" },
                      { label: "TOP SCORER (LEAGUE)" },
                      { label: "LEAST PIM (TEAM)" },
                      { label: "MOST SHOTS (TEAM)" }
                    ].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-4 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b border-white/10' : ''}`}>
                        <span className="font-black text-[8px] tracking-wider text-white/80 uppercase text-center">{item.label}</span>
                        <div className="w-12 h-12 rounded-full border-2 border-east-light/50 bg-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Award size={24} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* FULL STATS - Restored SCORING and SPECIALS */}
          {activeTab === 'full_stats' && (
            <div className="flex flex-col gap-8 animate-fadeIn">
              {/* SCORING Section */}
              <div className="flex flex-col gap-3">
                <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest px-2 text-center">SCORING</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <div className="grid grid-cols-2">
                    {[{ l: 'GP', v: 3 }, { l: 'GOALS', v: 3 }, { l: 'ASSISTS', v: 4 }, { l: 'POINTS', v: 6 }].map((stat, i) => (
                      <div key={i} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'border-r border-white/10' : ''} ${i < 2 ? 'border-b border-white/10' : ''}`}>
                        <span className="font-black text-[8px] tracking-wider text-white/80 uppercase">{stat.l}</span>
                        <span className="font-black text-2xl text-white italic">{stat.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SPECIALS Section */}
              <div className="flex flex-col gap-3">
                <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest px-2 text-center">SPECIALS</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <div className="grid grid-cols-2">
                    {[{ l: 'GWG', v: 1 }, { l: 'PPG', v: 1 }, { l: 'SHG', v: 34 }, { l: 'PIM', v: 10 }].map((stat, i) => (
                      <div key={i} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'border-r border-white/10' : ''} ${i < 2 ? 'border-b border-white/10' : ''}`}>
                        <span className="font-black text-[8px] tracking-wider text-white/80 uppercase">{stat.l}</span>
                        <span className="font-black text-2xl text-white italic">{stat.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NEWS */}
          {activeTab === 'news' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <Card className="hover:border-east-light/30 transition-colors group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&q=80&w=600" className="w-full h-40 object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="news" />
                <div className="p-5">
                  <h4 className="font-black italic text-lg text-white leading-none uppercase">LEE SCORES GAME WINNER</h4>
                  <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase leading-relaxed">Next game will take place in a few days vs the Wolves.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[8px] font-black text-east-light uppercase tracking-widest">Read Article</span>
                    <ChevronRight size={12} className="text-east-light" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="font-black italic text-sm text-white uppercase tracking-widest">Memories</h3>
                {!isReadOnly && (
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingGallery}
                    className="text-[10px] font-black text-east-light uppercase hover:text-white transition-all flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                  >
                    {uploadingGallery ? 'UPLOADING...' : <><ImageIcon size={12} /> ADD PHOTO</>}
                  </button>
                )}
                <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {displayGallery.map((src: string, i: number) => (
                  <div key={i} onClick={() => gallery.open(i)} className="aspect-square relative overflow-hidden rounded-xl bg-white/5 group cursor-pointer">
                    <img
                      src={src}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      alt="Gallery"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ImageIcon className="absolute bottom-2 right-2 text-white/50 opacity-0 group-hover:opacity-100" size={12} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Lightbox
        isOpen={gallery.isOpen}
        imageSrc={gallery.currentImage}
        onClose={gallery.close}
        onNext={gallery.next}
        onPrev={gallery.prev}
        currentIndex={gallery.selectedIndex ?? 0}
        totalImages={displayGallery.length}
      />
    </div>
  )
}