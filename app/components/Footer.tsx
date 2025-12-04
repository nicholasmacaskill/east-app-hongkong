'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FooterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Footer({ activeTab, setActiveTab }: FooterProps) {
  const router = useRouter();
  const [showStats, setShowStats] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        router.push('/');
        break;
      case 'check-in':
        router.push('/check-in');
        break;
      // Add other routes as needed
    }
  };

  return (
    <>
      {showStats && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <button 
            onClick={() => setShowStats(false)}
            className="absolute top-4 right-4 text-white text-2xl"
          >
            ✕
          </button>
          <iframe
            src="https://east.booking.dynevents.com/public/stats/league/22/season/27/divisions"
            className="w-full h-full rounded-lg"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          />
        </div>
      )}
      
      <nav className="navigation">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'check-in' ? 'active' : ''}`}
          onClick={() => handleTabChange('check-in')}
        >
          <span className="nav-icon">📱</span>
          <span>Check-In</span>
        </button>
        {/* Add other navigation items as needed */}
      </nav>
    </>
  );
}