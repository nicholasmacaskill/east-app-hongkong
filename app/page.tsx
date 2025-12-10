'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

// Screens
import HomeScreen from '@/app/components/screens/HomeScreen';
import ScheduleScreen from '@/app/components/screens/ScheduleScreen';
import CommunityScreen from '@/app/components/CommunityScreen';
import PlayerProfile from '@/app/components/screens/PlayerProfile'; 
import QRScreen from '@/app/components/screens/QRScreen'; 
import AuthScreen from '@/app/auth/AuthScreen';
import BottomNav from '@/app/components/BottomNav'; 

// Modals
import ClassModal from '@/app/components/modals/ClassModal'; 
import SettingsModal from '@/app/components/modals/SettingsModal'; 

import type { UserRole, Tab } from './types';
import { Session } from './types/session';

export interface UserProfileData {
    name: string; surname: string; username: string; bio: string; email: string; mobile: string; avatar_url?: string;
}

const initialProfileData: UserProfileData = {
    name: '', surname: '', username: '', bio: '', email: '', mobile: '', avatar_url: ''
};

export default function App() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // App State
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false); 
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [bookedSessionIds, setBookedSessionIds] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [userProfile, setUserProfile] = useState<UserProfileData>(initialProfileData);

  // 1. Auth & Data Fetch
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // A. INITIAL SETUP (If user is new)
        const emailName = user.email?.split('@')[0] || 'Member';
        
        // B. ENSURE PROFILE EXISTS
        await supabase
            .from('profiles')
            .upsert({ 
                id: user.id, 
                first_name: emailName, // Default Name
                avatar_url: 'https://placehold.co/100' 
            }, { onConflict: 'id', ignoreDuplicates: true });

        // C. FETCH REAL PROFILE DATA
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileData) {
            // ✅ FIX: Load every individual field correctly
            setUserProfile({
                name: profileData.first_name || '',
                surname: profileData.last_name || '',
                username: profileData.username || '', // The handle/nickname
                bio: profileData.bio || '',
                email: profileData.contact_email || user.email || '',
                mobile: profileData.mobile || '',
                avatar_url: profileData.avatar_url || ''
            });
        }

        // D. FETCH BOOKINGS
        fetch(`/api/my-schedule?userId=${user.id}`)
            .then(res => res.json())
            .then(data => { if(Array.isArray(data)) setBookedSessionIds(data.map((s: Session) => s.id)); });
            
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [refreshKey]);

  useEffect(() => {
    const targetTab = searchParams.get('tab') as Tab;
    if (targetTab && ['home', 'profile', 'qr', 'schedule', 'community'].includes(targetTab)) setActiveTab(targetTab);
  }, [searchParams]);

  // ✅ UPDATED: Save ALL Fields to their specific columns
  const handleSaveProfile = async (updatedData: UserProfileData) => {
      if (!currentUserId) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
            first_name: updatedData.name,
            last_name: updatedData.surname,
            username: updatedData.username,
            bio: updatedData.bio,
            mobile: updatedData.mobile,
            contact_email: updatedData.email,
            avatar_url: updatedData.avatar_url
        }) 
        .eq('id', currentUserId);

      if (error) {
          alert('Failed to save profile. ' + error.message);
          console.error(error);
      } else {
          setUserProfile(updatedData);
          setRefreshKey(prev => prev + 1); 
          alert('Profile updated successfully'); 
          setShowSettingsModal(false);
      }
  };

  if (loading) return <div className="bg-black h-screen text-white flex justify-center items-center">Loading...</div>;

  if (!currentUserId) return <AuthScreen onAuthSuccess={() => window.location.reload()} />;

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white font-opensans select-none">
      <div className="max-w-md mx-auto bg-black min-h-screen relative border-x border-gray-900 shadow-2xl">
        <main>
            {activeTab === 'home' && <HomeScreen onClassClick={(s) => { setSelectedSessions(s); setShowClassModal(true); }} bookedSessionIds={bookedSessionIds} onOpenSettings={() => setShowSettingsModal(true)} />}
            
            {activeTab === 'profile' && <PlayerProfile onOpenSettings={() => setShowSettingsModal(true)} profileData={userProfile} />}

            {activeTab === 'schedule' && <ScheduleScreen currentUserId={currentUserId} refreshKey={refreshKey} onPreviewClick={(s) => { setSelectedSessions([s]); setShowClassModal(true); }} />}

            {activeTab === 'community' && <CommunityScreen key={refreshKey} currentUserId={currentUserId} />}
            
            {activeTab === 'qr' && <QRScreen />}
        </main>

        <BottomNav activeTab={activeTab} setTab={setActiveTab} />

        {showClassModal && <ClassModal sessions={selectedSessions} currentUserId={currentUserId} bookedSessionIds={bookedSessionIds} onClose={() => setShowClassModal(false)} onScheduleChange={() => setRefreshKey(k => k + 1)} />}
        
        {showSettingsModal && (
            <SettingsModal 
                onClose={() => setShowSettingsModal(false)}
                onLogout={handleLogout}
                profileData={userProfile}
                setProfileData={setUserProfile}
                onSave={handleSaveProfile} 
            />
        )}
      </div>
    </div>
  );
}