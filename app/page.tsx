'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Home, User as UserIcon, QrCode, Activity, MessageSquare, 
    ChevronLeft, ChevronRight, ChevronDown, X, CheckCircle2, 
    Settings, LogOut, Bell, FileText, HelpCircle, Shield, 
    Edit2, ToggleLeft, ToggleRight, CreditCard, UserCog,
    Send, Share2, Target 
} from 'lucide-react'; 

// app/page.tsx
import { supabase } from '@/app/lib/supabase'; 
import CommunityScreen from '@/app/components/CommunityScreen'; // Import the new component

// Import Types
import type { UserRole, Tab, NewsItem } from './types';
import { Session } from './types/session'; 

// --- Interfaces ---
interface UserProfileData {
    name: string;
    surname: string;
    username: string;
    bio: string;
    email: string;
    mobile: string;
}

// ... (Keep UserPreferences and PlayerStats interfaces below this line)

// Interface for Preferences Screen data
interface UserPreferences {
    masterNotifications: boolean;
    newComments: boolean;
    newVideos: boolean;
    favouriteItem: string;
}

// --- Mock Data ---
const initialProfileData: UserProfileData = {
    name: 'Lee',
    surname: 'Wong',
    username: 'lee.wong12',
    bio: 'Defenseman for the Rhinos. Loves golf and spicy food.', // Default Bio
    email: 'lee@east.com',
    mobile: '+1 234 567 8900'
};

const initialPreferences: UserPreferences = {
    masterNotifications: true,
    newComments: false,
    newVideos: true,
    favouriteItem: ''
};


// ==========================================
// NEW: Reusable Settings UI Components
// ==========================================

const SettingsContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[100] bg-black/95 text-white p-6 animate-fadeIn overflow-y-auto select-none">
        <div className="max-w-md mx-auto h-full flex flex-col">
            {children}
        </div>
    </div>
);

const SettingsHeader = ({ title, onBack, isClose = false }: { title: string, onBack: () => void, isClose?: boolean }) => (
    <div className="flex items-center justify-between mb-8 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
            {isClose ? <X size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h2 className="font-montserrat font-bold text-xl tracking-tight">{title}</h2>
        <div className="w-8"></div>
    </div>
);

const SettingsSectionTitle = ({ title }: { title: string }) => (
    <h3 className="font-montserrat font-bold text-sm text-gray-500 uppercase tracking-wider mb-3 mt-8 px-2">{title}</h3>
);

const SettingsMenuItem = ({ icon: Icon, label, onClick, isDestructive = false }: { icon: any, label: string, onClick: () => void, isDestructive?: boolean }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full py-4 px-2 border-b border-gray-800 group hover:bg-white/5 transition-colors rounded-lg">
        <div className="flex items-center gap-4">
            <Icon size={20} className={isDestructive ? "text-red-500" : "text-gray-300 group-hover:text-east-light"} />
            <span className={`font-montserrat font-bold text-sm ${isDestructive ? "text-red-500" : "text-white"}`}>{label}</span>
        </div>
        {!isDestructive && <ChevronRight size={18} className="text-gray-600 group-hover:text-east-light transition-colors" />}
    </button>
);

const SettingsInput = ({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (val: string) => void, type?: string }) => (
    <div className="mb-6 relative">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
        <div className="relative border-b border-gray-700 pb-2 transition-colors focus-within:border-east-light">
            <input 
                type={type}
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent text-white font-montserrat font-bold text-lg focus:outline-none pr-8 placeholder:text-gray-700"
                placeholder={"Enter " + label.toLowerCase()}
            />
            <Edit2 size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
        </div>
    </div>
);

// ✅ New Text Area Component for Bio
const SettingsTextArea = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="mb-6 relative">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
        <div className="relative border-b border-gray-700 pb-2 transition-colors focus-within:border-east-light">
            <textarea 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-white font-montserrat font-bold text-sm focus:outline-none pr-8 placeholder:text-gray-700 resize-none leading-relaxed"
                placeholder={"Enter " + label.toLowerCase()}
            />
            <Edit2 size={16} className="absolute right-0 top-4 text-gray-600 pointer-events-none" />
        </div>
    </div>
);

const SettingsToggle = ({ label, isActive, onToggle }: { label: string, isActive: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-800">
        <span className="font-montserrat font-bold text-sm text-white">{label}</span>
        <button onClick={onToggle} className="transition-colors p-1 -mr-1 relative">
            {isActive ? (
                <ToggleRight size={36} className="text-east-light fill-current" />
            ) : (
                <ToggleLeft size={36} className="text-gray-600" />
            )}
        </button>
    </div>
);

const SettingsDropdown = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: {label:string, value:string}[] }) => (
    <div className="relative">
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white text-black font-montserrat font-bold text-sm py-4 px-6 rounded-full focus:outline-none appearance-none shadow-lg relative z-10"
        >
            <option value="" disabled>Choose your favourite Items</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-black z-20 pointer-events-none" size={20} />
    </div>
);


// ==========================================
// NEW: Settings Sub-Screens
// ==========================================

// --- Screen 2: Edit Profile ---
// ✅ UPDATED: Moved Bio to the top of the form
const EditProfileScreen = ({ onBack, profileData, setProfileData }: { onBack: () => void, profileData: UserProfileData, setProfileData: (data: UserProfileData) => void }) => {
    
    const handleChange = (field: keyof UserProfileData, value: string) => {
        setProfileData({ ...profileData, [field]: value });
    };

    return (
        <SettingsContainer>
            <SettingsHeader title="Edit Profile" onBack={onBack} />
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
                 {/* Profile Image Placeholder */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-28 h-28 rounded-full relative mb-4">
                        <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-[#1a1a1a]">
                            <UserIcon size={48} className="text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-black cursor-pointer hover:bg-gray-200">
                            <Edit2 size={14} className="text-black" />
                        </div>
                    </div>
                </div>

                {/* Form Fields - Bio is now FIRST */}
                <form onSubmit={(e) => e.preventDefault()} className="px-2 pb-12">
                    {/* ✅ Bio moved to top */}
                    <SettingsTextArea label="Profile Bio" value={profileData.bio} onChange={(v) => handleChange('bio', v)} />
                    
                    <SettingsInput label="Name" value={profileData.name} onChange={(v) => handleChange('name', v)} />
                    <SettingsInput label="Surname" value={profileData.surname} onChange={(v) => handleChange('surname', v)} />
                    <SettingsInput label="Username" value={profileData.username} onChange={(v) => handleChange('username', v)} />
                    
                    <SettingsInput label="Password" value="••••••••" type="password" onChange={() => console.log("Password edit flow")} />
                    <SettingsInput label="Email Address" value={profileData.email} onChange={(v) => handleChange('email', v)} />
                    <SettingsInput label="Mobile Number" value={profileData.mobile} onChange={(v) => handleChange('mobile', v)} />
                </form>
            </div>
        </SettingsContainer>
    );
};

// --- Screen 3: Preferences ---
const PreferencesScreen = ({ onBack }: { onBack: () => void }) => {
    const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences);

    const toggle = (field: keyof UserPreferences) => {
        setPrefs(prev => ({ ...prev, [field]: !prev[field as keyof UserPreferences] }));
    };

    return (
        <SettingsContainer>
             <SettingsHeader title="My Preferences" onBack={onBack} />

             <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-12">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center mb-4 bg-[#1a1a1a]">
                        <UserIcon size={48} className="text-white" />
                    </div>
                    <h2 className="font-montserrat font-bold text-xl">My Preferences</h2>
                </div>

                <SettingsSectionTitle title="Notifications" />
                <SettingsToggle label="Enable / Disable Notifications" isActive={prefs.masterNotifications} onToggle={() => toggle('masterNotifications')} />

                <SettingsSectionTitle title="Notification Types" />
                <div className={`transition-opacity ${prefs.masterNotifications ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <SettingsToggle label="New Comments" isActive={prefs.newComments} onToggle={() => toggle('newComments')} />
                    <SettingsToggle label="New Videos" isActive={prefs.newVideos} onToggle={() => toggle('newVideos')} />
                </div>

                <SettingsSectionTitle title="Favourite Items" />
                <div className="mb-4 mt-4">
                    <SettingsDropdown 
                        value={prefs.favouriteItem}
                        onChange={(val) => setPrefs(prev => ({...prev, favouriteItem: val}))}
                        options={[
                            { label: 'Hockey Equipment', value: 'hockey' },
                            { label: 'Team Merchandise', value: 'merch' },
                            { label: 'Training Gear', value: 'training' },
                        ]}
                    />
                </div>
                <p className="text-center text-xs font-bold text-gray-500 leading-relaxed px-8 mt-6">
                    You will receive notifications about these items new content
                </p>
            </div>
        </SettingsContainer>
    );
};

// --- Main Settings Coordinator Modal ---
// Updated to accept profile state props
const SettingsModal = ({ onClose, onLogout, profileData, setProfileData }: { 
    onClose: () => void, 
    onLogout: () => void,
    profileData: UserProfileData,
    setProfileData: (data: UserProfileData) => void
}) => {
    const [view, setView] = useState<'menu' | 'edit' | 'prefs'>('menu');

    if (view === 'edit') return <EditProfileScreen onBack={() => setView('menu')} profileData={profileData} setProfileData={setProfileData} />;
    if (view === 'prefs') return <PreferencesScreen onBack={() => setView('menu')} />;

    return (
        <SettingsContainer>
            <SettingsHeader title="Settings" onBack={onClose} isClose={true} />

            <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                <SettingsSectionTitle title="My Profile" />
                <SettingsMenuItem icon={UserCog} label="Personal Details" onClick={() => setView('edit')} />
                <SettingsMenuItem icon={Bell} label="My Preferences" onClick={() => setView('prefs')} />
                <SettingsMenuItem icon={CreditCard} label="Billing" onClick={() => console.log("Billing clicked")} />

                <SettingsSectionTitle title="Help" />
                <SettingsMenuItem icon={FileText} label="FAQ's" onClick={() => console.log("FAQ clicked")} />
                <SettingsMenuItem icon={HelpCircle} label="Support" onClick={() => console.log("Support clicked")} />

                <SettingsSectionTitle title="About" />
                <SettingsMenuItem icon={Shield} label="Privacy Policy" onClick={() => console.log("Privacy clicked")} />
                <SettingsMenuItem icon={FileText} label="Terms & conditions" onClick={() => console.log("Terms clicked")} />

                <div className="mt-12 px-2">
                    <button onClick={onLogout} className="flex items-center gap-4 w-full py-4 text-red-500 hover:bg-red-500/10 transition-colors rounded-lg px-4">
                        <LogOut size={20} />
                        <span className="font-montserrat font-bold text-sm">Log Out</span>
                    </button>
                </div>
            </div>
        </SettingsContainer>
    );
}


// ==========================================
// Existing App Code (Updated with Settings Triggers)
// ==========================================

// --- Local Interfaces for this file ---
interface PlayerStats {
    age: number;
    season: number;
    team: string;
    games_played_season: number;
    games_played_total: number;
    games_missed_healthy: number;
    games_missed_injured: number;
    goals_season: number;
    goals_total: number;
    assists_season: number;
    assists_total: number;
}

// --- Reusable UI ---

const SectionHeader = ({ title, className = "" }: { title: string, className?: string }) => (
  <h2 className={`font-montserrat font-black italic text-2xl uppercase text-white mb-4 tracking-tight ${className}`}>
    {title}
  </h2>
);

const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-east-card rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- Navigation ---
const BottomNav = ({ activeTab, setTab }: { activeTab: Tab; setTab: (t: Tab) => void }) => {
  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab; icon: any; label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button 
        onClick={() => setTab(tab)}
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500'}`}
      >
        <Icon size={24} className={isActive ? 'stroke-[3px]' : 'stroke-2'} />
        <span className="text-[10px] font-bold font-montserrat mt-1 uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 pb-safe pt-2 px-4 z-50">
      <div className="flex justify-between items-end max-w-md mx-auto">
        <NavItem tab="home" icon={Home} label="Home" />
        <NavItem tab="profile" icon={UserIcon} label="Profile" />
        <NavItem tab="qr" icon={QrCode} label="Check In" />
        <NavItem tab="schedule" icon={Activity} label="Schedule" />
        <NavItem tab="community" icon={MessageSquare} label="Community" />
      </div>
      <div className="flex justify-between items-center max-w-md mx-auto mt-2 px-2 pb-2">
        {['home', 'profile', 'qr', 'schedule', 'community'].map((t) => (
          <div key={t} className={`h-1 flex-1 rounded-full mx-1 transition-colors duration-300 ${activeTab === t ? 'bg-east-light' : 'bg-gray-800'}`} />
        ))}
      </div>
    </div>
  );
};

// --- Home Screen ---
// ==========================================
// HOME SCREEN (Fully Dynamic: Classes + Events + Facilities)
// ==========================================
// ==========================================
// HOME SCREEN (Dynamic Data + Original Animations)
// ==========================================
// ==========================================
// HOME SCREEN (With Grouping Logic)
// ==========================================
// ==========================================
// HOME SCREEN (Fixed: Grouping + Animations)
// ==========================================
// ==========================================
// HOME SCREEN (Updated: Visual "Booked" Status)
// ==========================================
// ==========================================
// HOME SCREEN (Updated: Auto-Refreshes Badges)
// ==========================================
// ==========================================
// HOME SCREEN (Cleaned up)
// ==========================================
const HomeScreen = ({ onClassClick, onOpenSettings, bookedSessionIds }: { onClassClick: (sessions: Session[]) => void, onOpenSettings: () => void, bookedSessionIds: number[] }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch All Sessions
  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setSessions(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // --- Helper: Group Sessions ---
  const getUniqueItems = (items: Session[], key: 'title' | 'instructor') => {
      const seen = new Set();
      return items.filter(item => {
          const val = item[key];
          if (seen.has(val)) return false;
          seen.add(val);
          return true;
      });
  };

  // Helper to check if ANY session in a group is booked (for the badge)
  const isGroupBooked = (item: Session, groupByKey: 'title' | 'instructor') => {
      const relatedSessions = sessions.filter(s => s[groupByKey] === item[groupByKey] && s.category === item.category);
      return relatedSessions.some(s => bookedSessionIds.includes(s.id));
  };

  // Filter Lists
  const adultRaw = sessions.filter(s => s.category === 'ADULT');
  const youthRaw = sessions.filter(s => s.category === 'YOUTH');
  const coachesRaw = sessions.filter(s => s.category === 'COACH');
  const facilitiesRaw = sessions.filter(s => s.category === 'FACILITY');
  const eventsRaw = sessions.filter(s => s.category === 'EVENT');
  const newsRaw = sessions.filter(s => s.category === 'NEWS');

  const adultUnique = getUniqueItems(adultRaw, 'title');
  const youthUnique = getUniqueItems(youthRaw, 'title');
  const coachesUnique = getUniqueItems(coachesRaw, 'instructor');
  const facilitiesUnique = getUniqueItems(facilitiesRaw, 'title');
  const eventsUnique = getUniqueItems(eventsRaw, 'title'); 

  // Click Handler
  const handleItemClick = (item: Session, groupByKey: 'title' | 'instructor') => {
      const allSlots = sessions.filter(s => s[groupByKey] === item[groupByKey] && s.category === item.category);
      allSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      onClassClick(allSlots);
  };

  return (
    <div className="pb-22 pt-4 px-4 space-y-8 animate-fadeIn relative">
      <div className="flex justify-between items-center mb-6 px-2 relative z-10">
         <div className="w-8"></div>
         <h1 className="font-montserrat font-black italic text-5xl text-white tracking-tighter drop-shadow-lg">
           E<span className="text-east-light">A</span>ST
         </h1>
         <button onClick={onOpenSettings} className="text-gray-400 hover:text-white transition-colors">
            <Settings size={24} />
         </button>
      </div>

      {/* Breaking News */}
      <div>
        <SectionHeader title="Breaking News" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x">
          {newsRaw.map((item) => (
            <div key={item.id} onClick={() => onClassClick([item])} className="snap-center min-w-[90%] relative rounded-2xl overflow-hidden aspect-[2/1] border border-gray-800 cursor-pointer group">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 w-3/4">
                <h3 className="font-montserrat font-black italic text-lg leading-tight mb-1 uppercase">{item.title}</h3>
                <p className="font-opensans text-xs text-gray-300 line-clamp-2">{item.description}</p>
              </div>
              <div className="absolute bottom-4 right-4">
                <button className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded">READ MORE</button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Facility Booking */}
      <div>
        <SectionHeader title="Facility Booking" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {facilitiesUnique.map((fac) => (
            <div key={fac.id} onClick={() => handleItemClick(fac, 'title')} className="flex flex-col gap-2 cursor-pointer group relative">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 bg-gray-900 relative">
                 <img src={fac.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={fac.title} />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                 {isGroupBooked(fac, 'title') && (
                    <div className="absolute top-2 right-2 bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded">BOOKED</div>
                 )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{fac.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Adult Classes */}
      <div>
        <SectionHeader title="Adult Classes" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {adultUnique.map((cls) => (
            <div key={cls.id} onClick={() => handleItemClick(cls, 'title')} className="flex flex-col gap-2 cursor-pointer group relative">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative">
                <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                {isGroupBooked(cls, 'title') && (
                    <div className="absolute top-2 right-2 bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded">BOOKED</div>
                )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{cls.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Youth Classes */}
      <div>
        <SectionHeader title="Youth Classes" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {youthUnique.map((cls) => (
            <div key={cls.id} onClick={() => handleItemClick(cls, 'title')} className="flex flex-col gap-2 cursor-pointer group relative">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative">
                <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                {isGroupBooked(cls, 'title') && (
                    <div className="absolute top-2 right-2 bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded">BOOKED</div>
                )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{cls.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Private Coach */}
      <div>
        <SectionHeader title="Private Coach" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-4 gap-3">
          {coachesUnique.map((c) => (
             <div key={c.id} onClick={() => handleItemClick(c, 'instructor')} className="flex flex-col items-center gap-2 cursor-pointer group relative">
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-white relative">
                <img src={c.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={c.instructor} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                {isGroupBooked(c, 'instructor') && (
                    <div className="absolute top-1 right-1 bg-east-light text-black text-[7px] font-black px-1 py-0.5 rounded-sm">✓</div>
                )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase">{c.instructor}</span>
             </div>
          ))}
        </div>
        )}
      </div>

      {/* Events List */}
      <div>
        <SectionHeader title="Events" />
        <div className="space-y-6">
            {loading ? <p className="text-xs text-gray-500">Loading...</p> : eventsUnique.map((event) => (
                <div key={event.id} className="cursor-pointer group relative" onClick={() => handleItemClick(event, 'title')}>
                   <div className="flex justify-between items-center mb-2">
                       <h4 className="font-montserrat font-bold italic text-[10px] text-white uppercase tracking-widest">{event.title}</h4>
                       {isGroupBooked(event, 'title') && (
                            <span className="bg-east-light text-black text-[8px] font-black px-2 py-0.5 rounded">REGISTERED</span>
                       )}
                   </div>
                   <div className="relative rounded-2xl overflow-hidden h-32 border border-gray-700 group-hover:border-east-light transition-colors duration-300">
                      <img src={event.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" alt={event.title}/>
                   </div>
                </div>
            ))}
        </div>
      </div>

      <div className="h-24 w-full" />
    </div>
  );
};

// --- Player Profile Component ---
const PlayerProfile = ({ onOpenSettings, profileData }: { onOpenSettings: () => void, profileData: UserProfileData }) => {
  const [activeTab, setActiveTab] = useState('streaks');
  const [stats, setStats] = useState<PlayerStats | null>(null);

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
          <img src="https://images.unsplash.com/photo-1593034509785-5b17ba49f683?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-40 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>

      <div className="relative z-10">
        {/* HEADER CONTAINER */}
        <div className="w-full max-w-md mx-auto flex flex-col">
            
            {/* 1. TOP VISUALS: Profile Pic & Number (Fixed height container) */}
            <div className="relative h-[250px] w-full shrink-0">
                {/* Settings Button */}
                <button onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
                    <Edit2 size={24} />
                </button>

                {/* Number #12 */}
                <div className="absolute right-8 top-20 z-0">
                    <h1 className="font-montserrat font-black italic text-[8rem] text-white/20 leading-none tracking-tighter select-none">#12</h1>
                </div>

                {/* Profile Picture */}
                <div className="absolute left-6 top-16 z-10">
                    <div className="w-48 h-48 rounded-full border-[6px] border-white/20 bg-white/10 overflow-hidden shadow-2xl">
                        <img src="https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg?_gl=1*hjxn7y*_ga*OTUzMzkyODc2LjE3NjEzMDgyNjc.*_ga_8JE65Q40S6*czE3NjQyOTgwMzMkbzUkZzEkdDE3NjQyOTgwNDckajQ2JGwwJGgw" className="w-full h-full object-cover opacity-90" />
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE CONTENT: Bio & Badges (Natural Flow) */}
            <div className="px-6 pb-8 flex flex-col gap-6 items-center w-full -mt-2">
                
                {/* BIO - Full width to remove horizontal gap */}
                {profileData.bio && (
                    <div className="w-full bg-black/40 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg text-center relative z-20">
                         <p className="text-white text-xs font-montserrat font-bold italic leading-relaxed">
                             "{profileData.bio}"
                         </p>
                    </div>
                )}

                {/* BADGES - Evenly spaced */}
                <div className="grid grid-cols-3 w-full">
                    {[
                        { l: 'TOP SCORER\n(TEAM)', url: 'https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png' },
                        { l: 'TOP SCORER\n(LEAGUE)', url: 'https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png'},
                        { l: 'MOST SHOTS\n(TEAM)', url: 'https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png' },
                    ].map((badge, i) => (
                      <div key={i} className="flex flex-col items-center group">
                        <img 
                            src={badge.url} 
                            className="w-10 h-10 object-contain mb-2 drop-shadow-md transition-transform group-hover:scale-110 rounded-full border-2 border-east-light p-1.5 bg-black/40" 
                            alt="Badge" 
                        />
                        {/* ✅ CHANGED: Added 'h-8' (fixed height) and explicit 'leading-3' to lock vertical rhythm */}
                        <div className="h-8 flex items-start justify-center w-full">
                            <span className="text-[9px] font-black font-montserrat uppercase text-center leading-3 text-white drop-shadow-md whitespace-pre-line">
                                {badge.l}
                            </span>
                        </div>
                      </div>
                    ))}
                </div>
            </div>

            {/* 3. GREEN BANNER (Natural Flow - Will always be below content) */}
            <div className="w-full bg-gradient-to-r from-east-light to-east-dark py-4 px-8 flex justify-between items-center shadow-lg border-y border-white/10 relative z-30">
              <div className="text-center">
                  <div className="font-montserrat font-black italic text-2xl text-white tracking-tighter" style={{ textShadow: '2px 2px 0px #000' }}>AGE</div>
                  <div className="font-black text-xl text-white mt-1 italic">{stats?.age || '31'}</div>
              </div>
              <div className="text-center">
                  <div className="font-montserrat font-black italic text-2xl text-white tracking-tighter" style={{ textShadow: '2px 2px 0px #000' }}>SEASON</div>
                  <div className="font-black text-xl text-white mt-1 italic">{stats?.season || '3'}</div>
              </div>
              <div className="text-center">
                  <div className="font-montserrat font-black italic text-2xl text-white tracking-tighter" style={{ textShadow: '2px 2px 0px #000' }}>TEAM</div>
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
              
              {/* --- GAMES ROW --- */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">GAMES</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                  <div className="grid grid-cols-2">
                    {[
                      { label: "GAMES PLAYED (SEASON)", value: stats?.games_played_season || 0 }, 
                      { label: "GAMES PLAYED (TOTAL)", value: stats?.games_played_total || 0 }, 
                      { label: "GAMES MISSED (HEALTHY)", value: stats?.games_missed_healthy || 0 }, 
                      { label: "GAMES MISSED (INJURED)", value: stats?.games_missed_injured || 0 }, 
                    ].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors
                        ${index % 2 === 0 ? 'border-r border-white/10' : ''}
                        ${index < 2 ? 'border-b border-white/10' : ''}
                      `}>
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

              {/* --- POINTS ROW --- */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">POINTS</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                  <div className="grid grid-cols-2">
                    {[
                      { label: "GOALS (SEASON)", value: stats?.goals_season || 0 }, 
                      { label: "GOALS (TOTAL)", value: stats?.goals_total || 0 }, 
                      { label: "ASSISTS (SEASON)", value: stats?.assists_season || 0 }, 
                      { label: "ASSISTS (TOTAL)", value: stats?.assists_total || 0 }, 
                    ].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-2 hover:bg-white/5 transition-colors
                        ${index % 2 === 0 ? 'border-r border-white/10' : ''}
                        ${index < 2 ? 'border-b border-white/10' : ''}
                      `}>
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

              {/* --- MILESTONES ROW --- */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">MILESTONES</h3>
                <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                  <div className="grid grid-cols-2">
                    {[
                      { label: "TOP SCORER (TEAM)" },
                      { label: "TOP SCORER (LEAGUE)" },
                      { label: "LEAST PIM (TEAM)" },
                      { label: "MOST SHOTS (TEAM)" },
                    ].map((item, index) => (
                      <div key={index} className={`flex flex-col items-center justify-center p-6 gap-4 hover:bg-white/5 transition-colors
                        ${index % 2 === 0 ? 'border-r border-white/10' : ''}
                        ${index < 2 ? 'border-b border-white/10' : ''}
                      `}>
                        <span className="font-montserrat font-bold text-[10px] tracking-wider text-white text-center uppercase">{item.label}</span>
                        
                        {/* Ribbon Badge Container */}
                        <div className="w-14 h-14 rounded-full border-2 border-[#4ade80] bg-black/80 flex items-center justify-center shadow-lg overflow-hidden">
                          <img 
                            src="https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png"
                            className="w-9 h-9 object-contain drop-shadow-sm" 
                            alt="Ribbon" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* --- MATES ROW --- */}
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

          {/* UPDATED FULL STATS TAB */}
          {activeTab === 'full_stats' && (
             <div className="flex flex-col gap-8">
                
                {/* SCORING ROW */}
                <div className="flex flex-col gap-2 w-full">
                   <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">SCORING</h3>
                   <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                      <div className="grid grid-cols-2">
                         {[
                           { l: 'GP', v: 3 }, { l: 'GOALS', v: 3 }, { l: 'ASSISTS', v: 4 }, { l: 'POINTS', v: 6 }
                         ].map((stat, i) => (
                            <div 
                               key={i} 
                               className={`flex flex-col items-center justify-center p-6 gap-3 hover:bg-white/5 transition-colors 
                                  ${i % 2 === 0 ? 'border-r border-white/10' : ''} 
                                  ${i < 2 ? 'border-b border-white/10' : ''}
                               `}
                            >
                               <div className="flex items-center gap-3">
                                  <img src="https://cdn-icons-png.flaticon.com/512/1454/1454453.png" alt="icon" className="w-5 h-5 object-contain opacity-70 invert" />
                                  <span className="font-montserrat font-bold text-xs tracking-wider text-white/70">{stat.l}</span>
                               </div>
                               <span className="font-montserrat font-black text-2xl text-white">{stat.v}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* SPECIALS ROW */}
                <div className="flex flex-col gap-2 w-full">
                   <h3 className="font-montserrat font-black italic text-sm text-white text-center tracking-[0.2em] opacity-80">SPECIALS</h3>
                   <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
                      <div className="grid grid-cols-2">
                         {[
                           { l: 'GWG', v: 1 }, { l: 'PPG', v: 1 }, { l: 'SHG', v: 34 }, { l: 'PIM', v: 10 }
                         ].map((stat, i) => (
                            <div 
                               key={i} 
                               className={`flex flex-col items-center justify-center p-6 gap-3 hover:bg-white/5 transition-colors 
                                  ${i % 2 === 0 ? 'border-r border-white/10' : ''} 
                                  ${i < 2 ? 'border-b border-white/10' : ''}
                               `}
                            >
                               <div className="flex items-center gap-3">
                                  <img src="https://cdn-icons-png.flaticon.com/512/1454/1454453.png" alt="icon" className="w-5 h-5 object-contain opacity-70 invert" />
                                  <span className="font-montserrat font-bold text-xs tracking-wider text-white/70">{stat.l}</span>
                               </div>
                               <span className="font-montserrat font-black text-2xl text-white">{stat.v}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-4">
              <Card>
                <img src="https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&q=80&w=600" className="w-full h-32 object-cover" />
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

const ParentProfile = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      date: d.getDate(),
      isAvailable: [true, true, false, true, false, true, true][i % 7] 
    };
  });

  return (
    <div className="pb-24 pt-12 animate-fadeIn bg-black min-h-screen relative">
      <button onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
         <Edit2 size={24} />
      </button>
      
      <div className="px-6 mb-6 pt-8">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 flex items-center gap-6 border border-gray-800 relative overflow-hidden mb-8 shadow-2xl">
            <div className="absolute top-0 right-0 bg-white text-black text-[10px] font-black italic px-3 py-1 uppercase">PARENT</div>
            
            <div className="w-20 h-20 rounded-full border-2 border-white p-1 flex-shrink-0">
               <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" className="w-full h-full rounded-full object-cover" />
            </div>
            
            <div className="flex flex-col">
               <h1 className="font-montserrat font-black italic text-2xl uppercase text-white leading-none mb-1 tracking-tight">SHARON</h1>
               <p className="font-montserrat font-bold text-[10px] text-east-light uppercase tracking-widest mb-3">HOCKEY MOM / LAWYER</p>
               <span className="bg-gray-800 text-gray-300 text-[8px] font-bold px-2 py-1 rounded w-fit border border-gray-700">OPEN TO VOLUNTEERING</span>
            </div>
          </div>

          <div className="mb-8">
             <div className="flex justify-between items-end mb-4 px-1">
                <h3 className="font-montserrat font-black italic text-lg text-white uppercase tracking-tight">MY ATHLETES</h3>
                <span className="text-[10px] font-bold text-east-light uppercase">View All</span>
             </div>
             <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x pb-4">
                {[1, 2].map((i) => (
                   <div key={i} className="snap-center min-w-[240px] bg-[#121c15] p-4 rounded-xl border border-east-dark/30 flex items-center gap-4 shadow-lg">
                      <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden relative border-2 border-east-light flex-shrink-0">
                         <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" />
                         <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                      </div>
                      <div>
                         <p className="font-montserrat font-black italic text-lg uppercase text-white leading-none mb-1">ZEN</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight">2ND YEAR • EAST SPORTS</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="mb-8">
             <SectionHeader title="Availability" />
             <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 min-w-max">
                   {next14Days.map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                         <span className="text-[10px] font-bold text-gray-500 uppercase">{day.day}</span>
                         <div className={`w-8 h-10 rounded flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-east-light text-black' : 'bg-gray-800 text-white'}`}>
                            {day.date}
                         </div>
                         {day.isAvailable ? (
                            <CheckCircle2 size={14} className="text-green-500" />
                         ) : (
                            <X size={14} className="text-red-500" />
                         )}
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="mb-8">
            <SectionHeader title="Contributions" />
            <div className="bg-gradient-to-r from-east-light to-east-dark rounded-xl shadow-lg border border-white/10 w-full overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-white/10">
            {[
            { label: 'Event Host' },
            { label: 'Carpool' },
            { label: 'Sponsor' },
            { label: 'Ambassador' }
            ].map((item, i) => (
            <div key={i} className="flex items-center p-6 gap-5 hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full border-2 border-[#4ade80] bg-black flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="https://www.citypng.com/public/uploads/preview/white-medal-ribbon-icon-png-img-701751695033073gjmv4za7ev.png"
                className="w-8 h-8 object-contain drop-shadow-md rounded-full bg-white/10 p-1" 
                alt="Badge" 
              />
            </div>
            <span className="font-montserrat font-extrabold italic text-m uppercase tracking-widest text-white">
              {item.label}
            </span>
            </div>
            ))}
            </div>
            </div>
            </div>

          <div className="mb-24">
             <SectionHeader title="Gallery" />
             <div className="grid grid-cols-3 gap-2">
                {[
                  "https://cdn.hockeycanada.ca/hockey-canada/community-engagement/asian-heritage-month/2025/2025-ahm-chihiro-suzuki.jpg?w=620&h=350&fit=crop?q=60&w=620&format=auto",
                  "https://eastsportsgroup.com/cdn/shop/files/WhatsApp_Image_2025-10-01_at_19.22.53.jpg?v=1759379442&width=1250",
                  "https://i1.wp.com/media.globalnews.ca/videostatic/335/843/larry_kwong_848x480_1190060611624.jpg?w=1040&quality=70&strip=all",
                  "https://eastsportsgroup.com/cdn/shop/files/esh.webp?v=1756778710&width=1500",
                  "https://st.focusedcollection.com/9163412/i/650/focused_517122206-stock-photo-focused-asian-male-athlete-doing.jpg",
                  "https://eastsportsgroup.com/cdn/shop/files/WhatsAppImage2024-11-21at14.04.48.jpg?v=1732169191&width=720",
                ].map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    className="rounded-lg aspect-square object-cover hover:opacity-80 transition-opacity" 
                    alt="Gallery"
                  />
                ))}
             </div>
          </div>

      </div>
    </div>
  )
}

// ==========================================
// SCHEDULE SCREEN
// ==========================================
// SCHEDULE SCREEN (Dynamic Data with Restored UI & Robust Refresh)
// ==========================================
const ScheduleScreen = ({ onPreviewClick, refreshKey, currentUserId }: { onPreviewClick: (s: Session) => void, refreshKey: number, currentUserId: number | null }) => {
  const [mySchedule, setMySchedule] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- UI/LOGIC RESTORED ---
  const [filter, setFilter] = useState<'parent' | 'player' | 'combined'>('player');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate()); 
  
  // Map Category to a visual theme for the list card
  const getTheme = (category: string) => {
    switch (category) {
      case 'YOUTH': return { color: '#D1F2D9', border: 'border-green-500', icon: '🏃' };
      case 'ADULT': return { color: '#F8F9FF', border: 'border-blue-500', icon: '💪' };
      case 'COACH': return { color: '#D8B4FE', border: 'border-purple-400', icon: '🎯' };
      case 'EVENT': return { color: '#FCA5A5', border: 'border-red-400', icon: '🎉' };
      case 'FACILITY': return { color: '#D1D5DB', border: 'border-gray-500', icon: '🏠' };
      default: return { color: '#FFFFFF', border: 'border-gray-300', icon: '🗓️' };
    }
  };

  // --- CRITICAL REFRESH LOGIC ---
  // Memoizes the function so it doesn't create a new one every render
  const fetchSchedule = useCallback(() => {
    if (!currentUserId) return;
    setLoading(true);

    fetch(`/api/my-schedule?userId=${currentUserId}`)
        .then(res => res.json())
        .then(data => {
            if(Array.isArray(data)) setMySchedule(data); 
        })
        .catch(console.error)
        .finally(() => setLoading(false));
  }, [currentUserId]); // Function only changes if the currentUserId changes


  useEffect(() => {
      // This ensures the schedule re-fetches whenever the refreshKey increments
      // OR when the user ID changes.
      fetchSchedule();
  }, [fetchSchedule, refreshKey]); // Dependencies ensure re-fetch after cancel/register

  // --- FILTER LOGIC ---
  const eventsForSelectedDay = mySchedule.filter(event => {
    const eventDate = new Date(event.start_time).getDate();
    return eventDate === selectedDay;
  });

  return (
    <div className="min-h-screen bg-black pb-24 animate-fadeIn relative">
       {/* ... (UI elements remain the same) ... */}
       <div className="fixed inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-black/80" />
       </div>

       <div className="relative z-10">
         {/* Filter Tabs (Parent/Player/Combined) */}
         <div className="flex pt-4 px-4 mb-4">
            {['PARENT', 'PLAYER', 'COMBINED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f.toLowerCase() as any)}
                className={`flex-1 text-center font-montserrat font-black italic text-sm py-3 border-b-4 transition-colors ${filter === f.toLowerCase() ? 'text-white border-white' : 'text-gray-500 border-gray-800'}`}
              >
                {f}
              </button>
            ))}
         </div>

         {/* Calendar Header (Restored Day Picker UI) */}
         <div className="mx-4 mb-6 rounded-2xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-east-light to-east-dark h-12 flex items-center px-4">
               <h2 className="text-white font-montserrat font-black italic text-xl">SCHEDULE</h2>
            </div>
            <div className="bg-white p-4 rounded-b-2xl -mt-2 relative z-10">
                <div className="mb-3 font-montserrat font-black italic text-black text-sm">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                </div>
                
                <div className="flex justify-between items-center">
                   <ChevronLeft size={24} className="text-black/50" />
                   {/* Dynamically render next 6 days */}
                   {Array.from({ length: 6 }, (_, i) => {
                       const realDate = new Date();
                       // Set the date to tomorrow, + i days
                       realDate.setDate(realDate.getDate() + (i + 1));
                       const dayNumber = realDate.getDate();
                       const dayOfWeek = realDate.toLocaleDateString('en-US', { weekday: 'narrow' }).toUpperCase();
                       const isSelected = dayNumber === selectedDay;
                       const isToday = dayNumber === new Date().getDate();

                       return (
                           <div 
                              key={i} 
                              onClick={() => setSelectedDay(dayNumber)}
                              className={`flex flex-col items-center justify-center w-10 h-16 rounded-full transition-all cursor-pointer ${isSelected ? 'bg-black text-white scale-110 shadow-lg' : (isToday ? 'bg-gray-200 text-black' : 'text-black')}`}
                           >
                              <span className="text-[9px] font-bold mb-0.5">{dayOfWeek}</span>
                              <span className="text-lg font-black italic">{dayNumber}</span>
                           </div>
                       );
                   })}
                   <ChevronRight size={24} className="text-black/50" />
                </div>
            </div>
         </div>

         {/* Events List (Dynamic, Filtered by Day) */}
         <div className="px-4 space-y-6 min-h-[300px]">
            {loading ? (
                <p className="text-center text-gray-500 text-xs py-10">Loading schedule...</p>
            ) : eventsForSelectedDay.length > 0 ? (
                eventsForSelectedDay.map((event, idx) => {
                    const theme = getTheme(event.category);
                    return (
                        <div 
                            key={idx} 
                            className="flex gap-4 animate-fadeIn cursor-pointer group" 
                            onClick={() => onPreviewClick(event)}
                        >
                            {/* Card */}
                            <div className="flex-1">
                                <div style={{ backgroundColor: theme.color }} className={`rounded-xl overflow-hidden text-black shadow-lg border-l-4 ${theme.border} transition-transform group-hover:scale-[1.01]`}>
                                    <div className="p-3 pb-2">
                                        <h3 className="font-montserrat font-black italic text-sm uppercase">{event.title}</h3>
                                        <p className="text-xs font-bold mt-0.5 text-gray-600">
                                            {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    
                                    {/* Footer (Simplified) */}
                                    <div className="bg-gray-100 p-2 px-3 flex justify-between items-center border-t border-gray-300">
                                        <span className="text-[10px] font-black italic text-gray-700">HOST: {event.instructor}</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPreviewClick(event);
                                            }}
                                            className="bg-black text-white text-[8px] font-bold italic px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                                        >
                                            PREVIEW
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl bg-gray-900/50">
                    <p className="font-montserrat font-bold italic text-gray-500 mb-2">NO SESSIONS SCHEDULED</p>
                    <p className="text-xs text-gray-600">Go to Home to register for a session.</p>
                </div>
            )}
         </div>
       </div>
    </div>
  );
};

// --- 6. QR Screen ---
const QRScreen = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-fadeIn pb-24 relative">
       {/* Background */}
       <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000" 
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-black/60" />
       </div>

      <div className="w-full max-w-xs bg-white text-black rounded-3xl overflow-hidden shadow-2xl relative z-10">
        {/* Top Decoration */}
        <div className="h-3 w-full bg-gradient-to-r from-east-light to-east-dark" />
        
        <div className="p-8 flex flex-col items-center">
           <h2 className="font-montserrat font-black italic text-3xl mb-1 uppercase tracking-tighter text-black">CHECK IN</h2>
           <p className="font-bold text-[10px] text-gray-400 uppercase mb-8 tracking-widest">SCAN AT FRONT DESK</p>

           <div className="relative p-4 border-[6px] border-black rounded-2xl mb-8 bg-white shadow-xl">
             <QrCode size={160} strokeWidth={2} className="text-black" />
             {/* Corner accents */}
             <div className="absolute -top-2 -left-2 w-6 h-6 border-t-[6px] border-l-[6px] border-east-light rounded-tl-lg" />
             <div className="absolute -top-2 -right-2 w-6 h-6 border-t-[6px] border-r-[6px] border-east-light rounded-tr-lg" />
             <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-[6px] border-l-[6px] border-east-light rounded-bl-lg" />
             <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-[6px] border-r-[6px] border-east-light rounded-br-lg" />
           </div>

           <div className="text-center w-full">
             <div className="font-montserrat font-black italic text-2xl uppercase">LEE</div>
             <div className="font-bold text-[10px] text-east-dark uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               ACTIVE MEMBER
             </div>
           </div>

           <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 w-full flex justify-between items-center">
             <div>
                 <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">MEMBER ID</div>
                 <div className="font-montserrat font-black text-lg tracking-widest">#8821-XJ</div>
             </div>
             <div className="h-10 w-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                 <UserIcon size={18} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

  const renderChatDetail = () => (
    <div className="h-full flex flex-col relative animate-fadeIn bg-black">
        {/* Header Image Area */}
        <div className="h-[40vh] relative shrink-0">
           <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
           
           {/* User Info Overlay */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-800 mb-4 shadow-2xl">
                 <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-montserrat font-black italic text-5xl text-white tracking-tighter uppercase">LEE</h1>
           </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 pt-4 space-y-1">
           {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  {msg.isMe ? (
                      <div className="bg-east-light text-black px-4 py-3 rounded-xl rounded-tr-none max-w-[80%] shadow-lg">
                         <p className="font-montserrat font-bold italic text-xs uppercase">{msg.text}</p>
                      </div>
                  ) : (
                      <div className="mb-.05">
                         <span className="font-montserrat font-black italic text-white text-2xl uppercase">{msg.text}</span>
                      </div>
                  )}
              </div>
           ))}
           <div className="flex justify-end pt-4">
              <button 
                onClick={() => setViewMode('messenger-list')}
                className="text-white font-bold italic text-[10px] underline uppercase tracking-wider hover:text-east-light transition-colors"
              >
                BACK TO MESSAGE LIBRARY
              </button>
           </div>
        </div>
    </div>
  );

  const renderFeed = () => (
    <div className="h-full flex flex-col relative animate-fadeIn">
       {/* Background */}
       <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1555685812-8b9c85c7954c?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-30 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
       </div>

       <div className="relative z-10 px-4 pt-6 flex-1 overflow-y-auto pb-32">
         {/* Header */}
         <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => setViewMode('messenger-list')}>
             <h1 className="font-montserrat font-black italic text-3xl text-white">FEED</h1>
             <ChevronDown className="text-white" />
         </div>

         {/* Tabs */}
         <div className="flex gap-4 mb-8">
             {['GENERAL', 'TEAM', 'LEAGUE'].map(tab => (
                <button 
                  key={tab}
                  className="bg-white text-black font-montserrat font-bold italic text-xs px-6 py-2 rounded-full uppercase hover:bg-east-light transition-colors"
                >
                   {tab}
                </button>
             ))}
         </div>

         {/* Post */}
         <div className="mb-8">
             <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                   <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" />
                </div>
                <div>
                   <h3 className="font-montserrat font-black italic text-white text-lg uppercase leading-none">COACH RHETT</h3>
                   <p className="font-bold text-[10px] text-gray-400 uppercase">HONG KONG WARRIORS</p>
                </div>
             </div>

             <div className="rounded-3xl overflow-hidden bg-[#1a1a1a] border border-gray-800 shadow-2xl">
                <div className="aspect-video w-full relative">
                   <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" />
                </div>
                <div className="p-6 bg-[#1a1a1a]">
                   <p className="font-montserrat font-bold italic text-xs text-gray-300 leading-relaxed uppercase">
                      HOPING TO MEET OTHER MEMBERS OF THE LEAGUE AT TONIGHTS LEAGUE WIDE EVENT, IT'S BEEN GREAT PLAYING WITH AND AGAINST EVERYONE THIS YEAR!
                   </p>
                </div>
             </div>
         </div>
       </div>
    </div>
  );

// ==========================================
// CLASS MODAL (Restored UI + DB Connection)

// ==========================================
// CLASS MODAL (Handles Multi-Slot Registration & CANCELLATION FIX)
// ==========================================
// ==========================================
// CLASS MODAL (CRITICAL CANCELLATION FIX)
// ==========================================
// ==========================================
// CLASS MODAL (Updated: Auto-Close on Success)
// ==========================================
// ==========================================
// CLASS MODAL (Updated: Auto-Close on Success)
// ==========================================
// ==========================================
// CLASS MODAL (Updated: Auto-Close on Success)
// ==========================================
// ==========================================
// CLASS MODAL (Fixed Logic: Checks Booked IDs)
// ==========================================
const ClassModal = ({ sessions, onClose, onScheduleChange, currentUserId, bookedSessionIds }: { 
    sessions: Session[], 
    onClose: () => void, 
    onScheduleChange: () => void, 
    currentUserId: number | null,
    bookedSessionIds: number[] 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  if (!sessions || sessions.length === 0 || !currentUserId) return null;

  const displaySession = sessions[0];
  const isNews = displaySession.category === 'NEWS';
  
  useEffect(() => {
      if (sessions.length === 1) {
          setSelectedSessionId(sessions[0].id);
      }
  }, [sessions]);

  // CORE FIX: Check if the *selected* session is actually booked
  const isBooked = selectedSessionId ? bookedSessionIds.includes(selectedSessionId) : false;

  const handleAction = async (method: 'POST' | 'DELETE') => {
    if (!selectedSessionId || isNews) return;
    
    setIsProcessing(true);
    const userId = currentUserId; 

    try {
      const res = await fetch('/api/register', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId: selectedSessionId }),
      });

      if (res.ok) {
        // Trigger parent refresh (this updates bookedSessionIds)
        onScheduleChange();
        // We DO NOT close here automatically anymore, so you can see the state flip from "Cancel" to "Register"
      } else if (res.status === 409) {
        alert('You are already registered for this slot.');
      } else {
        alert(`${method === 'POST' ? 'Registration' : 'Cancellation'} failed.`);
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to server.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
         {/* Header */}
         <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
            <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">
                {isBooked ? 'MY BOOKING' : (displaySession.category === 'COACH' ? displaySession.instructor : displaySession.title)}
            </h2>
            <button onClick={onClose}><X className="text-white" /></button>
         </div>

         {/* Content */}
         <div className="overflow-y-auto p-6 text-black">
            <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase">{displaySession.title}</h2>
            <p className="font-montserrat font-bold text-[10px] mb-4 uppercase">
                {displaySession.category === 'COACH' ? 'PRIVATE COACH' : `INSTRUCTOR: ${displaySession.instructor}`}
            </p>
            <p className="font-opensans text-xs font-bold leading-relaxed mb-6">{displaySession.description}</p>
            
            {displaySession.image_url && (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-6">
                    <img src={displaySession.image_url} className="w-full h-full object-cover" alt={displaySession.title} />
                </div>
            )}

<button onClick={() => onShare && onShare(displaySession)} className="hover:text-east-light transition-colors">
    <Share2 className="text-white" size={20} />
</button>

            {/* Time Selection */}
            {!isNews && (
                <div className="mb-6">
                    <p className="font-montserrat font-bold text-[10px] mb-2 uppercase">SELECT TIME:</p>
                    <div className="flex gap-2 flex-wrap">
                        {sessions.map((sess) => {
                            const isThisSessionBooked = bookedSessionIds.includes(sess.id);
                            return (
                                <button
                                    key={sess.id}
                                    onClick={() => setSelectedSessionId(sess.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors relative 
                                        ${selectedSessionId === sess.id ? 'bg-east-light text-white border-east-light' : 'bg-white text-black border-gray-300 hover:border-east-light'}
                                    `}
                                >
                                    {new Date(sess.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                    {isThisSessionBooked && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Show Booking Details for Scheduled Item */}
            {isBooked && selectedSessionId && (
                <div className="mb-6 p-4 border border-red-500/50 rounded-xl bg-red-500/10">
                    <p className="font-montserrat font-bold text-[10px] text-red-500 uppercase mb-2">SCHEDULED TIME:</p>
                    <p className="font-montserrat font-black text-lg text-black">
                        {new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            )}

         </div>

         {/* Footer Action */}
         {!isNews && (
             <div className="bg-black p-4 flex justify-between items-center shrink-0">
                <div className="flex gap-4">
                   <Send className="text-white" size={20} />
                   <Share2 className="text-white" size={20} />
                </div>
                
                {isBooked ? (
                     <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to cancel?")) {
                                handleAction('DELETE');
                            }
                        }}
                        disabled={isProcessing}
                        className="text-red-500 text-sm font-bold italic underline disabled:opacity-50 hover:text-red-400 transition-colors"
                     >
                       {isProcessing ? 'CANCELLING...' : 'CANCEL BOOKING'}
                     </button>
                ) : (
                    <button 
                      onClick={() => handleAction('POST')}
                      disabled={isProcessing || !selectedSessionId}
                      className="text-white text-sm font-bold italic underline disabled:opacity-50 hover:text-east-light transition-colors"
                    >
                      {isProcessing ? 'REGISTERING...' : 'REGISTER NOW'}
                    </button>
                )}

             </div>
         )}
      </div>
    </div>
  );
};


// ... (All other components above remain the same) ...

// --- Main App Layout ---

// ... (All other components above remain the same) ...

// ... (All other components above remain the same) ...

// --- Main App Layout ---

// ... (All other components above remain the same) ...

// --- Main App Layout ---

// ... (keep all your imports and other components above this)

export default function App() {
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]); 
  
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData>(initialProfileData);

  // Global state for booked IDs
  const [bookedSessionIds, setBookedSessionIds] = useState<number[]>([]);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0); 

  const [showShareModal, setShowShareModal] = useState(false);
  const [sessionToShare, setSessionToShare] = useState<Session | null>(null);

  const handleShareEvent = async (targetUserId: string) => {
      // Hardcode current user to Lee's UUID for testing (or use auth context)
      const senderId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 
      
      if(!sessionToShare) return;
      
      const { error } = await supabase.from('messages').insert({
          sender_id: senderId,
          receiver_id: targetUserId,
          content: `Check out this event: ${sessionToShare.title}`,
          shared_event_id: sessionToShare.id
      });
      
      if(!error) {
          alert('Event Sent!');
          setShowShareModal(false);
      } else {
          console.error(error);
          alert('Failed to send');
      }
  };
  // --------------------------------

  // MOCK IDS: Player=12, Parent=13
  const getCurrentUserId = () => {
      if (userRole === 'player') return 12; 
      if (userRole === 'parent') return 13; 
      return null;
  }
  const currentUserId = getCurrentUserId();

  // 1. Fetch Booked Sessions (Global Source of Truth)
  useEffect(() => {
    if (!currentUserId) return;
    
    fetch(`/api/my-schedule?userId=${currentUserId}`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) {
           // Store just the IDs so we can easily check "is this booked?" anywhere
           setBookedSessionIds(data.map((s: Session) => s.id));
        }
      })
      .catch(console.error);
  }, [currentUserId, scheduleRefreshKey]); // Re-runs when user or refreshKey changes

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole | null;
    if (storedRole) {
        setUserRole(storedRole);
        setIsLoading(false);
    } else {
        router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
      localStorage.removeItem('userRole');
      router.replace('/login');
  };
  
  // Handlers for Modal Actions
  const handleScheduleChange = () => {
      setScheduleRefreshKey(prev => prev + 1); // Triggers re-fetch of bookedSessionIds
      // We do NOT close the modal here to allow the user to see the state change
  }

  const handleCloseModal = () => {
      setShowClassModal(false);
  }
  
  if (isLoading || !userRole) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-east-light">LOADING...</div>;
  }

  // ... inside export default function App() { ...

  return (
    <div className="min-h-screen bg-black text-white font-opensans select-none">
      <div className="max-w-md mx-auto bg-black min-h-screen relative shadow-2xl border-x border-gray-900">
        <main>
          {activeTab === 'home' && (
            <HomeScreen 
                onClassClick={(sessions) => {
                    setSelectedSessions(sessions);
                    setShowClassModal(true);
                }} 
                onOpenSettings={() => setShowSettingsModal(true)}
                bookedSessionIds={bookedSessionIds} 
            />
          )}
          {activeTab === 'profile' && (
              userRole === 'player' ? 
              <PlayerProfile onOpenSettings={() => setShowSettingsModal(true)} profileData={userProfile} /> : 
              <ParentProfile onOpenSettings={() => setShowSettingsModal(true)} />
          )}
          {activeTab === 'qr' && <QRScreen />}
          {activeTab === 'schedule' && (
            <ScheduleScreen 
                onPreviewClick={(session) => {
                    setSelectedSessions([session]);
                    setShowClassModal(true);
                }}
                refreshKey={scheduleRefreshKey} 
                currentUserId={currentUserId} 
            />
          )}
          {/* ✅ UPDATED: Renders the new imported component */}
          {activeTab === 'community' && <CommunityScreen />}
        </main>

        <BottomNav activeTab={activeTab} setTab={setActiveTab} />
        
        {/* ✅ NEW: Share Modal Logic */}
        {showShareModal && sessionToShare && (
            <ShareModal 
                event={sessionToShare} 
                onClose={() => setShowShareModal(false)}
                onSend={handleShareEvent}
            />
        )}

        {/* ✅ UPDATED: Class Modal now handles onShare */}
        {showClassModal && currentUserId && (
            <ClassModal 
                sessions={selectedSessions}
                onClose={handleCloseModal}
                onScheduleChange={handleScheduleChange} 
                currentUserId={currentUserId}
                bookedSessionIds={bookedSessionIds}
                onShare={(session) => {
                    setSessionToShare(session);
                    setShowShareModal(true);
                }}
            /> 
        )}
        
        {showSettingsModal && (
            <SettingsModal 
                onClose={() => setShowSettingsModal(false)} 
                onLogout={handleLogout} 
                profileData={userProfile} 
                setProfileData={setUserProfile} 
            />
        )}
      </div>
    </div>
  );
}