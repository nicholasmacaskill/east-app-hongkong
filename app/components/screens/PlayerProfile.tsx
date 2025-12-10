'use client';
import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

// Simple Card Wrapper
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#1e1e1e] rounded-xl overflow-hidden ${className}`}>
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

export default function PlayerProfile({ onOpenSettings, profileData }: { onOpenSettings: () => void, profileData: any }) {
  const [activeTab, setActiveTab] = useState('streaks');
  const [stats, setStats] = useState<PlayerStats | null>(null);

  // Safety Check
  if (!profileData) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  useEffect(() => {
    // Mock Data
    setStats({
        age: 31, season: 3, team: 'RHINOS',
        games_played_season: 12, games_played_total: 45, games_missed_healthy: 0, games_missed_injured: 2,
        goals_season: 5, goals_total: 22, assists_season: 8, assists_total: 30
    });
  }, []);

  return (
    <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden">
      
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1593034509785-5b17ba49f683?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-40 grayscale" alt="bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>

      <div className="relative z-10">
        {/* HEADER CONTAINER */}
        <div className="w-full max-w-md mx-auto flex flex-col">
            
            {/* 1. TOP VISUALS */}
            <div className="relative h-[250px] w-full shrink-0">
                <button onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
                    <Edit2 size={24} />
                </button>

                <div className="absolute right-8 top-20 z-0">
                    <h1 className="font-montserrat font-black italic text-[8rem] text-white/20 leading-none tracking-tighter select-none">#12</h1>
                </div>

                <div className="absolute left-6 top-16 z-10">
                    <div className="w-48 h-48 rounded-full border-[6px] border-white/20 bg-white/10 overflow-hidden shadow-2xl">
                        <img 
                            src={profileData.avatar_url || "https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg"} 
                            className="w-full h-full object-cover opacity-90" 
                            alt="profile"
                        />
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE CONTENT: Name, Bio & Badges */}
            <div className="px-6 pb-8 flex flex-col gap-6 items-center w-full -mt-2">
                
                {/* ✅ UPDATED: Player Name Display (Smaller Size: text-2xl) */}
                <div className="w-full flex flex-col items-center pt-8"> 
                    <h2 className="font-montserrat font-black italic text-2xl text-white uppercase tracking-tighter leading-none text-center">
                        {profileData.name} <span className="text-east-light">{profileData.surname}</span>
                    </h2>
                    {profileData.username && (
                        <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-1">@{profileData.username}</p>
                    )}
                </div>

                {profileData.bio && (
                    <div className="w-full bg-black/40 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg text-center relative z-20">
                         <p className="text-white text-xs font-montserrat font-bold italic leading-relaxed">"{profileData.bio}"</p>
                    </div>
                )}

                <div className="grid grid-cols-3 w-full">
                    {[
                        { l: 'TOP SCORER\n(TEAM)', url: 'https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png' },
                        { l: 'TOP SCORER\n(LEAGUE)', url: 'https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png'},
                        { l: 'MOST SHOTS\n(TEAM)', url: 'https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png' },
                    ].map((badge, i) => (
                      <div key={i} className="flex flex-col items-center group">
                        <img src={badge.url} className="w-10 h-10 object-contain mb-2 drop-shadow-md transition-transform group-hover:scale-110 rounded-full border-2 border-east-light p-1.5 bg-black/40" alt="Badge" />
                        <div className="h-8 flex items-start justify-center w-full">
                            <span className="text-[9px] font-black font-montserrat uppercase text-center leading-3 text-white drop-shadow-md whitespace-pre-line">{badge.l}</span>
                        </div>
                      </div>
                    ))}
                </div>
            </div>

            {/* 3. GREEN BANNER */}
            <div className="w-full bg-gradient-to-r from-east-light to-east-dark py-4 px-8 flex justify-between items-center shadow-lg border-y border-white/10 relative z-30">
              <div className="text-center">
                  <div className="font-montserrat font-black italic text-2xl text-white tracking-tighter">AGE</div>
                  <div className="font-black text-xl text-white mt-1 italic">{stats?.age || '31'}</div>
              </div>
              <div className="text-center">
                  <div className="font-montserrat font-black italic text-2xl text-white tracking-tighter">SEASON</div>
                  <div className="font-black text-xl text-white mt-1 italic">{stats?.season || '3'}</div>
              </div>
              <div className="text-center">
                  <div className="font-montserrat font-black italic text-2xl text-white tracking-tighter">TEAM</div>
                  <div className="font-black text-xl text-white mt-1 italic">{stats?.team || 'RHINOS'}</div>
              </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-center gap-8 py-6 relative z-20">
            {['STREAKS', 'FULL STATS', 'NEWS'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '_'))} 
                className={`font-montserrat font-black italic text-lg uppercase transition-all drop-shadow-lg ${activeTab === tab.toLowerCase().replace(' ', '_') ? 'text-white border-b-4 border-white pb-1' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
        </div>

        {/* CONTENT AREA */}
        <div className="px-4 pb-24 w-full">
          {activeTab === 'streaks' && (
            <div className="flex flex-col gap-8">
              {/* GAMES ROW */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">GAMES</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                  <div className="grid grid-cols-2">
                    {[{ label: "GAMES PLAYED (SEASON)", value: stats?.games_played_season || 0 }, { label: "GAMES PLAYED (TOTAL)", value: stats?.games_played_total || 0 }, { label: "GAMES MISSED (HEALTHY)", value: stats?.games_missed_healthy || 0 }, { label: "GAMES MISSED (INJURED)", value: stats?.games_missed_injured || 0 }].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b border-white/10' : ''}`}>
                        <div className="flex items-center gap-2 text-center">
                          <img src="https://cdn-icons-png.flaticon.com/512/1454/1454453.png" alt="icon" className="w-3 h-3 object-contain invert" />
                          <span className="font-montserrat font-bold text-[10px] tracking-wider text-white max-w-[120px] uppercase">{item.label}</span>
                        </div>
                        <span className="font-montserrat font-black text-2xl text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* POINTS ROW */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">POINTS</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                  <div className="grid grid-cols-2">
                    {[{ label: "GOALS (SEASON)", value: stats?.goals_season || 0 }, { label: "GOALS (TOTAL)", value: stats?.goals_total || 0 }, { label: "ASSISTS (SEASON)", value: stats?.assists_season || 0 }, { label: "ASSISTS (TOTAL)", value: stats?.assists_total || 0 }].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b border-white/10' : ''}`}>
                        <div className="flex items-center gap-2 text-center">
                          <img src="https://cdn-icons-png.flaticon.com/512/1454/1454453.png" alt="icon" className="w-3 h-3 object-contain invert" />
                          <span className="font-montserrat font-bold text-[10px] tracking-wider text-white max-w-[120px] uppercase">{item.label}</span>
                        </div>
                        <span className="font-montserrat font-black text-2xl text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MILESTONES & MATES */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">MILESTONES</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                   <div className="grid grid-cols-2">
                    {[{ label: "TOP SCORER (TEAM)" }, { label: "TOP SCORER (LEAGUE)" }, { label: "LEAST PIM (TEAM)" }, { label: "MOST SHOTS (TEAM)" }].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-4 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b border-white/10' : ''}`}>
                        <span className="font-montserrat font-bold text-[10px] tracking-wider text-white text-center uppercase">{item.label}</span>
                        <div className="w-14 h-14 rounded-full border-2 border-[#4ade80] bg-black/80 flex items-center justify-center shadow-lg overflow-hidden">
                          <img src="https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png" className="w-9 h-9 object-contain drop-shadow-sm" alt="Ribbon" />
                        </div>
                      </div>
                    ))}
                   </div>
                </div>
              </div>
              
              {/* MATES ROW */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">MATES</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full p-8">
                  <div className="flex flex-wrap justify-center items-center gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-white shadow-lg hover:scale-110 transition-transform cursor-pointer">
                        <img src="https://eastsportsgroup.com/cdn/shop/files/WhatsApp_Image_2025-10-01_at_19.22.53.jpg?v=1759379442&width=1250" className="w-full h-full object-cover object-top" alt="Teammate"/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FULL STATS */}
          {activeTab === 'full_stats' && (
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2 w-full">
                   <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">SCORING</h3>
                   <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                      <div className="grid grid-cols-2">
                         {[{ l: 'GP', v: 3 }, { l: 'GOALS', v: 3 }, { l: 'ASSISTS', v: 4 }, { l: 'POINTS', v: 6 }].map((stat, i) => (
                            <div key={i} className={`flex flex-col items-center justify-center p-6 gap-3 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'border-r border-white/10' : ''} ${i < 2 ? 'border-b border-white/10' : ''}`}>
                               <div className="flex items-center gap-3"><img src="https://cdn-icons-png.flaticon.com/512/1454/1454453.png" alt="icon" className="w-5 h-5 object-contain opacity-70 invert" /><span className="font-montserrat font-bold text-xs tracking-wider text-white/70">{stat.l}</span></div>
                               <span className="font-montserrat font-black text-2xl text-white">{stat.v}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                   <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">SPECIALS</h3>
                   <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                      <div className="grid grid-cols-2">
                         {[{ l: 'GWG', v: 1 }, { l: 'PPG', v: 1 }, { l: 'SHG', v: 34 }, { l: 'PIM', v: 10 }].map((stat, i) => (
                            <div key={i} className={`flex flex-col items-center justify-center p-6 gap-3 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'border-r border-white/10' : ''} ${i < 2 ? 'border-b border-white/10' : ''}`}>
                               <div className="flex items-center gap-3"><img src="https://cdn-icons-png.flaticon.com/512/1454/1454453.png" alt="icon" className="w-5 h-5 object-contain opacity-70 invert" /><span className="font-montserrat font-bold text-xs tracking-wider text-white/70">{stat.l}</span></div>
                               <span className="font-montserrat font-black text-2xl text-white">{stat.v}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* NEWS */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <Card>
                <img src="https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&q=80&w=600" className="w-full h-32 object-cover" alt="news" />
                <div className="p-4">
                  <h4 className="font-montserrat font-bold italic text-sm text-white">LEE SCORES GAME WINNER</h4>
                  <p className="text-xs text-gray-400 mt-2">Next game will take place in a few days vs the Wolves.</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}