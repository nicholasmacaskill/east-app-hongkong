'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Home, User, QrCode, Activity, MessageSquare, Plus } from 'lucide-react';

// Screens
import HomeScreen from '@/app/components/screens/HomeScreen';
import ScheduleScreen from '@/app/components/screens/ScheduleScreen';
// import CommunityScreen from '@/app/components/CommunityScreen';
import PlayerProfile from '@/app/components/screens/PlayerProfile';
import CoachProfile from '@/app/components/screens/CoachProfile';
import ParentProfile from '@/app/components/screens/ParentProfile';
import QRScreen from '@/app/components/screens/QRScreen';
import CoachDashboard from '@/app/components/screens/CoachDashboard'; // NEW DASHBOARD
import AuthScreen from '@/app/auth/AuthScreen';
import LandingScreen from '@/app/components/screens/LandingScreen';
import BottomNav from '@/app/components/BottomNav';

// Modals
import ClassModal from '@/app/components/modals/ClassModal';
import SettingsModal from '@/app/components/modals/SettingsModal';
import NewsArticleModal from '@/app/components/modals/NewsArticleModal';

import { ToastProvider } from '@/app/components/ui/Toast';
import type { UserRole, Tab } from './types';
import { Session } from './types/session';

// 1. Updated Interface to include credits and role
export interface UserProfileData {
  name: string;
  surname: string;
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  email: string;
  mobile: string;
  avatar_url?: string;
  credits: number;
  gallery_images: string[];
  schedule_photo_url?: string;
  role?: UserRole;
  intro_video_url?: string;
  id?: string;
  preferences?: any;
}

// 2. Updated Initial State
const initialProfileData: UserProfileData = {
  name: '', surname: '', first_name: '', last_name: '', username: '', bio: '', email: '', mobile: '', avatar_url: '', credits: 0, gallery_images: [], schedule_photo_url: '', intro_video_url: '', role: undefined, preferences: {}
};

function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // App State
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [selectedNews, setSelectedNews] = useState<Session | null>(null);
  const [bookedSessions, setBookedSessions] = useState<Session[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [myChildren, setMyChildren] = useState<any[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfileData>(initialProfileData);

  // 1. Auth & Data Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);

          // A. INITIAL SETUP (If user is new)
          const emailName = user.email?.split('@')[0] || 'Member';

          // B. ENSURE PROFILE EXISTS (DOUBTFUL UPSERT - PREFER SELECT THEN INSERT)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!existingProfile) {
            // Wait / Retry logic handled by UI loading state or subsequent fetch
          }

          // C. FETCH REAL PROFILE DATA
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) {
            setUserProfile({
              name: profileData.first_name || '',
              surname: profileData.last_name || '',
              first_name: profileData.first_name || '',
              last_name: profileData.last_name || '',
              username: profileData.username || '',
              bio: profileData.bio || '',
              email: profileData.contact_email || user.email || '',
              mobile: profileData.mobile || '',
              avatar_url: profileData.avatar_url || '',
              credits: profileData.credits || 0,
              gallery_images: profileData.gallery_images || [],
              schedule_photo_url: profileData.schedule_photo_url || '',
              intro_video_url: profileData.intro_video_url || '',
              role: profileData.role as UserRole,
              id: profileData.id,
              preferences: profileData.preferences || {}
            });
          } else {
            // Fallback: Use Metadata if Profile is missing (406 or pending trigger)
            const metadataRole = user.user_metadata?.role as UserRole;
            if (metadataRole) {
              setUserProfile(prev => ({
                ...prev,
                email: user.email || '',
                role: metadataRole,
                id: user.id
              }));
            }
          }

          // D. FETCH BOOKINGS (SAFER VERSION)
          try {
            const res = await fetch(`/api/my-schedule?userId=${user.id}`);


            if (res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                if (Array.isArray(data)) {
                  setBookedSessions(data);
                }
              }
            }
          } catch (fetchError) {
            console.error("Error fetching schedule:", fetchError);
          }


          // E. FETCH CHILDREN (IF PARENT)
          if (profileData && profileData.role === 'parent') {
            const { data: childrenData } = await supabase
              .from('profiles')
              .select('*')
              .eq('parent_id', user.id);

            if (childrenData) {
              // Map sport from bio if needed, or just pass raw
              const childrenWithTeams = childrenData.map(c => ({
                ...c,
                team: c.bio?.replace(' Player', '') || 'Athlete' // Simple extraction or default
              }));
              setMyChildren(childrenWithTeams);
            }
          }

        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [refreshKey]);

  useEffect(() => {
    const targetTab = searchParams.get('tab');
    const isTab = (t: string): t is Tab => {
      return ['home', 'profile', 'coach', 'schedule', 'community', 'qr'].includes(t);
    };
    if (targetTab && isTab(targetTab)) {
      setActiveTab(targetTab);
    }

    if (searchParams.get('success') === 'true') {
      setRefreshKey(prev => prev + 1);
      router.replace('/');
      alert("Purchase Successful! Credits added.");
    }
  }, [searchParams, router]);

  // NEW: Auto-redirect admin (Top-level effect)
  useEffect(() => {
    if (userProfile.role === 'admin') {
      router.push('/sys-admin');
    }
  }, [userProfile.role, router]);

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
        avatar_url: updatedData.avatar_url,
        gallery_images: updatedData.gallery_images,
        intro_video_url: updatedData.intro_video_url
      })
      .eq('id', currentUserId);

    if (error) {
      alert('Failed to save profile. ' + error.message);
    } else {
      setUserProfile(updatedData);
      setRefreshKey(prev => prev + 1);
      alert('Profile updated successfully');
      setShowSettingsModal(false);
    }
  };

  const handleClassClick = (s: Session[]) => {
    if (s.length === 1 && s[0].category === 'NEWS') {
      setSelectedNews(s[0]);
      setShowNewsModal(true);
      return;
    }
    setSelectedSessions(s);
    setShowClassModal(true);
  };

  if (loading) return <div className="bg-black h-screen text-white flex justify-center items-center font-montserrat font-black italic uppercase tracking-widest animate-pulse">Loading...</div>;

  if (!currentUserId) {
    if (!selectedRole) {
      return <LandingScreen onSelectRole={setSelectedRole} />;
    }
    return (
      <div className="relative min-h-screen bg-black">
        <button
          onClick={() => setSelectedRole(null)}
          className="absolute top-6 left-6 z-50 text-[10px] font-black italic text-white/40 uppercase tracking-widest hover:text-white transition-colors"
        >
          ← BACK
        </button>
        <AuthScreen
          expectedRole={selectedRole || undefined}
          onAuthSuccess={(role) => {
            if (role === 'admin') {
              window.location.href = '/sys-admin';
            } else {
              window.location.reload();
            }
          }}
        />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // ----------------------------------------------------
  // COACH VIEW (Redirect to Master Dashboard)
  // ----------------------------------------------------
  if (userProfile.role === 'coach') {
    return (
      <CoachDashboard
        currentUserId={currentUserId}
        userName={userProfile.first_name || 'Coach'}
      />
    );
  }

  // AUTO-REDIRECT ADMINS TO PORTAL (UI ONLY)
  if (userProfile.role === 'admin') {
    return (
      <div className="bg-black min-h-screen text-white flex justify-center items-center">
        <p className="text-gray-500 font-montserrat">Redirecting to admin portal...</p>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-black text-white font-opensans select-none">
      <div className="max-w-md mx-auto bg-black min-h-screen relative border-x border-gray-900 shadow-2xl">
        <main>


          {activeTab === 'home' && (
            <HomeScreen
              onClassClick={handleClassClick}
              onOpenSettings={() => setShowSettingsModal(true)}
              bookedSessions={bookedSessions}
              credits={userProfile.credits || 0}
              setTab={setActiveTab}
            />
          )}

          {activeTab === 'profile' && (
            (userProfile.role as string) === 'coach' || (userProfile.role as string) === 'admin'
              ? <CoachProfile onOpenSettings={() => setShowSettingsModal(true)} profileData={userProfile} currentUserId={currentUserId} />
              : userProfile.role === 'parent'
                ? <ParentProfile onOpenSettings={() => setShowSettingsModal(true)} profileData={userProfile} myChildren={myChildren} onAddChild={() => setRefreshKey(prev => prev + 1)} />
                : <PlayerProfile onOpenSettings={() => setShowSettingsModal(true)} profileData={userProfile} />
          )}



          {activeTab === 'schedule' && (
            <ScheduleScreen
              currentUserId={currentUserId}
              refreshKey={refreshKey}
              availability={userProfile.preferences?.availability || []}
              onPreviewClick={(s) => { setSelectedSessions([s]); setShowClassModal(true); }}
            />
          )}

          {/* {activeTab === 'community' && <CommunityScreen key={refreshKey} currentUserId={currentUserId} />} */}

          {activeTab === 'qr' && <QRScreen credits={userProfile.credits || 0} currentUserId={currentUserId} />}
        </main>

        <BottomNav activeTab={activeTab} setTab={setActiveTab} />

        {showClassModal && <ClassModal sessions={selectedSessions} currentUserId={currentUserId} bookedSessions={bookedSessions} onClose={() => setShowClassModal(false)} onScheduleChange={() => setRefreshKey(k => k + 1)} />}

        {showSettingsModal && (
          <SettingsModal
            onClose={() => setShowSettingsModal(false)}
            onLogout={handleLogout}
            profileData={userProfile}
            setProfileData={setUserProfile}
            onSave={handleSaveProfile}
          />
        )}

        {showNewsModal && selectedNews && (
          <NewsArticleModal
            item={selectedNews}
            onClose={() => setShowNewsModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="bg-black h-screen text-white flex justify-center items-center font-montserrat font-black italic uppercase tracking-widest animate-pulse">Loading...</div>}>
        <AppContent />
      </Suspense>
    </ToastProvider>
  );
}