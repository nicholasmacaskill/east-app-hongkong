'use client';
import { Home, User as UserIcon, QrCode, Activity, MessageSquare } from 'lucide-react';
import type { Tab } from '@/app/types';

interface BottomNavProps {
    activeTab: Tab;
    setTab: (t: Tab) => void;
}

export default function BottomNav({ activeTab, setTab }: BottomNavProps) {
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
}