'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, 
    Home, User as UserIcon, QrCode, Activity, MessageSquare 
} from 'lucide-react';
import type { Tab } from '../types';

const plans = [
  {
    id: 'gym',
    name: 'GYM PASS',
    shortName: 'GYM',
    priceMonthly: '1,000',
    priceYearly: '11,000',
    savings: 'SAVE 1,000 ANNUALLY',
    sections: [
      { title: 'ACCESS', items: [{ label: 'GYM AND LOUNGE', value: 'INCLUDED', isPositive: true }] },
      { title: 'LOCKER', items: [{ label: 'MONTHLY', value: '800 p/m', isPositive: true }, { label: 'SEASONAL', value: '8,000', isPositive: true }] },
      { title: 'BOOKING', items: [{ label: 'CLASSES', value: 'INCLUDED', isPositive: true }] },
      { title: 'CLASSES', items: [{ label: 'FREE CLASSES', value: 'INCLUDED', isPositive: true }] },
    ]
  },
  {
    id: 'all',
    name: 'ALL PASS',
    shortName: 'ALL',
    priceMonthly: '2,000',
    priceYearly: '22,000',
    savings: 'SAVE 2,000 ANNUALLY',
    sections: [
      { title: 'ACCESS', items: [{ label: 'GYM AND LOUNGE', value: 'INCLUDED', isPositive: true }, { label: 'GOLF SIM', value: 'INCLUDED', isPositive: true }] },
      { title: 'LOCKER', items: [{ label: 'MONTHLY', value: '500 p/m', isPositive: true }] },
      { title: 'BOOKING', items: [{ label: 'CLASSES', value: '7 DAYS AHEAD', isPositive: true }] },
      { title: 'FACILITY BOOKING', items: [{ label: 'SHOOTING PAD', value: '50 / 30 MIN', isPositive: true }] }
    ]
  },
  {
    id: 'elite',
    name: 'ELITE PASS',
    shortName: 'ELITE',
    priceMonthly: '3,500',
    priceYearly: '35,000',
    savings: 'SAVE 7,000 ANNUALLY',
    sections: [
      { title: 'ACCESS', items: [{ label: 'GYM AND LOUNGE', value: 'INCLUDED', isPositive: true }, { label: 'SHOOTING PAD', value: 'INCLUDED', isPositive: true }] },
      { title: 'BOOKING', items: [{ label: 'CLASSES', value: '8 DAYS AHEAD', isPositive: true }] },
      { title: 'CLASSES', items: [{ label: 'CLASS DISCOUNT', value: '100%', isPositive: true }] },
      { title: 'FACILITY BOOKING', items: [{ label: 'GOLF (1-2 HOURS)', value: '250 HOURS', isPositive: true }] }
    ]
  }
];

export default function MembershipPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState('gym');
  const activeNavTab: Tab = 'qr'; 

  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  return (
    <div className="h-screen bg-black text-white font-opensans select-none flex justify-center overflow-hidden">
      
      <div className="fixed inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover opacity-20 blur-sm"
            alt="Gym Background"
          />
          <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="w-full max-w-md bg-transparent h-full relative flex flex-col z-10 border-x border-gray-900 shadow-2xl">
        
        <div className="flex items-center px-4 pt-6 pb-2 shrink-0">
            {/* UPDATED logic: Force route back to QR Check-in screen */}
            <button onClick={() => router.push('/?tab=qr')} className="text-gray-400 hover:text-white transition-colors absolute left-6 z-20">
                <ChevronLeft size={28} />
            </button>
            <div className="w-full text-center">
                <h1 className="font-montserrat font-black italic text-3xl text-white tracking-tighter uppercase">
                    MEMBERSHIP
                </h1>
            </div>
        </div>

        <div className="flex px-12 mb-2 shrink-0 gap-6 justify-center">
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`text-center font-montserrat font-black italic text-[12px] py-2 flex-1 border-b-4 transition-all uppercase tracking-widest ${
                    selectedPlanId === plan.id ? 'text-white border-east-light' : 'text-gray-600 border-gray-800'
                }`}
              >
                {plan.shortName}
              </button>
            ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24"> 
            <div className="w-full max-w-xs bg-white rounded-3xl overflow-hidden flex flex-col text-black shadow-2xl relative h-[540px]">
                <div className="h-3 w-full bg-gradient-to-r from-east-light to-east-dark shrink-0" />

                <div className="p-6 flex flex-col h-full overflow-hidden">
                    <div className="text-center mb-4 border-b border-gray-100 pb-4 shrink-0">
                        <h2 className="font-montserrat font-black italic text-3xl uppercase mb-1 leading-tight tracking-tighter">{activePlan.name}</h2>
                        <div className="flex items-baseline justify-center gap-1">
                             <span className="font-montserrat font-black italic text-2xl tracking-tight">{activePlan.priceMonthly}</span>
                             <span className="font-montserrat font-black italic text-[11px] text-gray-500 uppercase tracking-tight">p/m</span>
                        </div>
                        <div className="mt-2 inline-block bg-black text-east-light text-[10px] font-black italic px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                            {activePlan.savings}
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 flex-1 overflow-hidden px-4">
                        {activePlan.sections.map((section, idx) => (
                            <div key={idx} className="flex flex-col gap-1 pr-2">
                                <h3 className="font-montserrat font-black italic text-[11px] text-gray-400 uppercase border-b border-gray-100 pb-0.5 tracking-wider">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center leading-none py-1">
                                            <span className="font-montserrat font-black italic text-[13px] text-gray-800 uppercase leading-none tracking-tight">{item.label}</span>
                                            <span className={`font-montserrat font-black italic text-[13px] uppercase text-right pl-2 ${item.isPositive ? 'text-east-dark' : 'text-gray-400'}`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full bg-black text-white font-montserrat font-black italic text-[14px] py-4 rounded-full uppercase tracking-wider hover:bg-gray-900 transition-all shadow-lg shrink-0 mt-auto active:scale-95">
                        JOIN NOW
                    </button>
                </div>
            </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 pb-safe pt-2 px-4 z-50">
            <div className="flex justify-between items-end max-w-md mx-auto">
                <NavItem tab="home" icon={Home} label="Home" activeTab={activeNavTab} />
                <NavItem tab="profile" icon={UserIcon} label="Profile" activeTab={activeNavTab} />
                <NavItem tab="qr" icon={QrCode} label="Check In" activeTab={activeNavTab} />
                <NavItem tab="schedule" icon={Activity} label="Schedule" activeTab={activeNavTab} />
                <NavItem tab="community" icon={MessageSquare} label="Community" activeTab={activeNavTab} />
            </div>
            <div className="flex justify-between items-center max-w-md mx-auto mt-2 px-2 pb-2">
                {['home', 'profile', 'qr', 'schedule', 'community'].map((t) => (
                    <div key={t} className={`h-1 flex-1 rounded-full mx-1 transition-colors duration-300 ${activeNavTab === t ? 'bg-east-light' : 'bg-gray-800'}`} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

const NavItem = ({ tab, icon: Icon, label, activeTab }: { tab: Tab; icon: any; label: string, activeTab: Tab }) => {
    const router = useRouter();
    const isActive = activeTab === tab;
    return (
        <button 
            onClick={() => router.push(`/?tab=${tab}`)}
            className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500'}`}
        >
            <Icon size={24} className={isActive ? 'stroke-[3px]' : 'stroke-2'} />
            <span className="text-[10px] font-bold font-montserrat mt-1 uppercase tracking-wider italic">{label}</span>
        </button>
    );
};