'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Home, User, QrCode, Activity, MessageSquare, Plus } from 'lucide-react';
import { ToastProvider, useToast } from '@/app/components/ui/Toast';

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
import TransactionHistoryModal from '@/app/components/modals/TransactionHistoryModal';
import LockedOverlay from '@/app/components/ui/LockedOverlay';
import ProcessingOverlay from '@/app/components/ui/ProcessingOverlay';

// 25: deleted
import type { UserRole, Tab, UserProfileData } from './types';
import { Session } from './types/session';
import { fetchProfileResilient } from '@/app/lib/authProfile';

// 1. Updated Interface to include credits and role


// 2. Updated Initial State
const initialProfileData: UserProfileData = {
  name: '', surname: '', first_name: '', last_name: '', username: '', bio: '', email: '', mobile: '', avatar_url: '', credits: 0, gallery_images: [], schedule_photo_url: '', intro_video_url: '', role: undefined, preferences: {}, subscription_status: 'inactive', account_status: 'active', membership_start: undefined, membership_expires: undefined, membership_history: []
};

function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // App State
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [selectedServiceDescription, setSelectedServiceDescription] = useState<string | null>(null);
  const [selectedCoachName, setSelectedCoachName] = useState<string | null>(null);
  const [selectedCoachBio, setSelectedCoachBio] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<'facilities' | 'coaches'>('facilities');
  const [selectedNews, setSelectedNews] = useState<Session | null>(null);
  const [bookedSessions, setBookedSessions] = useState<Session[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [myChildren, setMyChildren] = useState<any[]>([]);
  const [selectedInitialSessionId, setSelectedInitialSessionId] = useState<number | null>(null);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null); // NEW

  const [userProfile, setUserProfile] = useState<UserProfileData>(initialProfileData);
  const isWaitingForCreditsRef = React.useRef(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const processingToastIdRef = React.useRef<string | null>(null);
  const hasAttemptedRepair = React.useRef(false);

  // 1. Auth & Data Fetch
  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 seconds max loading time

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Define metadataRole early for use in fallback logic
        const metadataRole = user?.user_metadata?.role;

        if (user) {


          setCurrentUserId(user.id);

          // A. INITIAL SETUP (If user is new)
          const emailName = user.email?.split('@')[0] || 'Member';

          // B. ENSURE PROFILE EXISTS
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          // C. FETCH REAL PROFILE DATA (Resiliently)
          const profileData = await fetchProfileResilient(user.id);



          if (profileData) {
            // FIX: Ensure admins/coaches land on the correct dashboard
            if (profileData.role === 'admin' || profileData.role === 'coach' || profileData.role === 'sys-admin') {
              setSelectedRole(profileData.role as UserRole);
            }

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
              preferences: profileData.preferences || {},
              subscription_status: profileData.subscription_status,
              account_status: profileData.account_status,
              membership_start: profileData.membership_start,
              membership_expires: profileData.membership_expires,
              membership_history: profileData.membership_history || []
            });
          } else if (!hasAttemptedRepair.current) {
            console.log("⚠️ No profile found. Attempting auto-repair once...");
            hasAttemptedRepair.current = true; // Block future attempts this session

            // 1. Set temporary UI state from metadata
            if (metadataRole) {
              setUserProfile(prev => ({
                ...prev,
                email: user.email || '',
                role: metadataRole,
                id: user.id,
                first_name: user.user_metadata?.first_name || 'Member',
                last_name: user.user_metadata?.last_name || 'User',
                subscription_status: 'inactive'
              }));
            }

            // 2. Call Repair API
            try {
              const repairRes = await fetch('/api/user/repair-profile', { method: 'POST' });
              if (repairRes.ok) {
                console.log("✅ Profile repaired! Reloading...");
                setRefreshKey(prev => prev + 1); // Trigger re-fetch
              } else {
                console.error("❌ Repair failed:", await repairRes.text());
              }
            } catch (repairErr) {
              console.error("❌ Repair error:", repairErr);
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
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    init();
    return () => clearTimeout(safetyTimeout);
  }, [refreshKey]);

  // 2. Real-time Profile Listener
  useEffect(() => {
    if (!currentUserId) return;

    console.log("🚀 Initializing real-time profile listener for:", currentUserId);

    const channel = supabase
      .channel(`profile-updates-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('🔄 Profile update detected:', payload.new);
          const newData = payload.new;

          // Debug hook for Playwright
          if (typeof window !== 'undefined') {
            (window as any).lastProfileUpdate = newData;
          }

          if (isWaitingForCreditsRef.current) {
            console.log("💰 Webhook pulse detected while waiting for credits.");
            setUserProfile(prev => {
              // If credits increased, we're done waiting
              if (newData.credits > prev.credits) {
                console.log("✅ Credits confirmed! Clearing wait state.");
                isWaitingForCreditsRef.current = false;
                setIsProcessingPayment(false);
                if (processingToastIdRef.current) {
                  removeToast(processingToastIdRef.current);
                  processingToastIdRef.current = null;
                }
                addToast("Credits Authenticated! You're ready to book.", "success");
              }
              return {
                ...prev,
                credits: newData.credits ?? prev.credits,
                subscription_status: newData.subscription_status ?? prev.subscription_status,
                account_status: newData.account_status ?? prev.account_status,
                membership_expires: newData.membership_expires ?? prev.membership_expires,
                role: newData.role ?? prev.role,
                first_name: newData.first_name ?? prev.first_name,
                last_name: newData.last_name ?? prev.last_name,
                name: newData.first_name ?? prev.name,
                surname: newData.last_name ?? prev.surname,
              };
            });
          } else {
            setUserProfile(prev => ({
              ...prev,
              credits: newData.credits ?? prev.credits,
              subscription_status: newData.subscription_status ?? prev.subscription_status,
              account_status: newData.account_status ?? prev.account_status,
              membership_expires: newData.membership_expires ?? prev.membership_expires,
              role: newData.role ?? prev.role,
              first_name: newData.first_name ?? prev.first_name,
              last_name: newData.last_name ?? prev.last_name,
              name: newData.first_name ?? prev.name,
              surname: newData.last_name ?? prev.surname,
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Real-time channel status for ${currentUserId}:`, status);
      });

    return () => {
      console.log("🔌 Cleaning up profile listener");
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    const targetTab = searchParams.get('tab');
    const isTab = (t: string): t is Tab => {
      return ['home', 'profile', 'coach', 'schedule', 'community', 'qr'].includes(t);
    };
    if (targetTab && isTab(targetTab)) {
      setActiveTab(targetTab);
    }

    if (searchParams.get('success') === 'true') {
      isWaitingForCreditsRef.current = true;
      router.replace('/');
      const tid = addToast("Payment Received. Finalizing credits...", "loading", 0);
      processingToastIdRef.current = tid;

      // Safety timeout - if no webhook in 30s, refresh manually
      setTimeout(() => {
        if (isWaitingForCreditsRef.current) {
          isWaitingForCreditsRef.current = false;
          if (processingToastIdRef.current) {
            removeToast(processingToastIdRef.current);
            processingToastIdRef.current = null;
          }
          setRefreshKey(prev => prev + 1);
          addToast("Credit sync taking longer than usual. Refreshing...", "info");
        }
      }, 30000);
    }
  }, [searchParams, router, addToast]);


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
      addToast('Failed to save profile: ' + error.message, 'error');
    } else {
      setUserProfile(updatedData);
      setRefreshKey(prev => prev + 1);
      addToast('Profile updated successfully', 'success');
      setShowSettingsModal(false);
    }
  };

  const handleClassClick = (
    s: Session[],
    description?: string | null,
    origin: 'facilities' | 'coaches' = 'facilities',
    coachName?: string | null,
    coachBio?: string | null,
    initialSessionId?: number | null,
    attendeeId?: string | null,
    serviceId?: string | null // NEW
  ) => {
    if (s.length === 1 && s[0].category === 'NEWS') {
      setSelectedNews(s[0]);
      setShowNewsModal(true);
      return;
    }
    setSelectedSessions(s);
    setSelectedServiceDescription(description || null);
    setSelectedOrigin(origin);
    setSelectedCoachName(coachName || null);
    setSelectedCoachBio(coachBio || null);
    setSelectedInitialSessionId(initialSessionId || null);
    setSelectedAttendeeId(attendeeId || null);
    setSelectedServiceId(serviceId || null); // NEW STATE
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
            if (role === 'admin' || role === 'sys-admin') {
              window.location.href = '/sys-admin';
            } else {
              setRefreshKey(prev => prev + 1);
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
  // COACH VIEW (Dedicated, Full-Screen, Responsive)
  // ----------------------------------------------------
  if (userProfile.role === 'coach') {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <CoachDashboard
          currentUserId={currentUserId}
          userName={userProfile.first_name || 'Coach'}
          userLastName={userProfile.last_name || ''}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // ADMIN VIEW (Portal Redirect)
  // ----------------------------------------------------
  if (userProfile.role === 'admin' || userProfile.role === 'sys-admin') {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col justify-center items-center font-montserrat p-6 select-none cursor-default">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#28D160]/5 via-black to-black z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center animate-fadeIn">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-white drop-shadow-2xl">
            Admin <span className="text-[#28D160]">Access</span>
          </h1>
          <p className="text-gray-500 mb-12 text-center max-w-xs text-xs font-bold uppercase tracking-widest">
            Welcome Administrator. Access the management portal below.
          </p>

          <button
            onClick={() => window.location.href = '/sys-admin'}
            className="group relative bg-[#28D160] text-black font-black italic text-xl px-12 py-5 rounded-2xl uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(40,209,96,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] hover:-translate-y-1 active:translate-y-0.5 active:scale-95 duration-300"
          >
            Enter Portal
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-12 transition-colors hover:scale-105"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }



  // ----------------------------------------------------
  // LOCKING LOGIC (Bug #6 Fix)
  // ----------------------------------------------------
  const isSubscriber = userProfile.subscription_status === 'active' || userProfile.subscription_status === 'trialing';
  const isManuallyActive = userProfile.account_status === 'active';
  const isUnlocked = isSubscriber || isManuallyActive;

  // Only apply locking to player/parent roles. Admins/Coaches bypass this.
  const needsLockCheck = userProfile.role === 'player' || userProfile.role === 'parent';
  const showLockedOverlay = needsLockCheck && !isUnlocked;

  return (
    <div className="min-h-screen bg-black text-white font-opensans select-none">
      <div className="max-w-md mx-auto bg-black min-h-screen relative border-x border-gray-900 shadow-2xl">
        {showLockedOverlay && <LockedOverlay />}
        <ProcessingOverlay isOpen={isProcessingPayment} />
        <main>



          {activeTab === 'home' && (
            <>
              <HomeScreen
                onClassClick={handleClassClick}
                onOpenSettings={() => setShowSettingsModal(true)}
                bookedSessions={bookedSessions}
                credits={userProfile.credits || 0}
                subscriptionStatus={userProfile.subscription_status}
                accountStatus={userProfile.account_status}
                setTab={setActiveTab}
              />

            </>
          )}

          {activeTab === 'profile' && (
            (userProfile.role as string) === 'sys-admin' ? (
              <div className="flex h-screen items-center justify-center">
                <p className="text-white">Redirecting to Admin Panel...</p>
              </div>
            ) : (
              (userProfile.role as string) === 'admin'
                ? <CoachProfile onOpenSettings={() => setShowSettingsModal(true)} profileData={userProfile} currentUserId={currentUserId} />
                : userProfile.role === 'parent'
                  ? <ParentProfile
                    onOpenSettings={() => setShowSettingsModal(true)}
                    profileData={userProfile}
                    myChildren={myChildren}
                    onAddChild={async (child) => {
                      try {
                        const res = await fetch('/api/family/add-child', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            firstName: child.first,
                            lastName: child.last,
                            email: child.email,
                            sport: child.sport,
                            parentId: currentUserId
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          addToast(`Error: ${data.error}`, 'error');
                        } else {
                          addToast('Child added successfully!', 'success');
                          setRefreshKey(prev => prev + 1);
                        }
                      } catch (e: any) {
                        addToast(`Failed to add child: ${e.message}`, 'error');
                      }
                    }}
                  />
                  : <PlayerProfile
                    onOpenSettings={() => setShowSettingsModal(true)}
                    profileData={userProfile}
                    onRefresh={() => setRefreshKey(k => k + 1)}
                    onShowHistory={() => setShowHistoryModal(true)}
                  />
            )
          )}

          {activeTab === 'schedule' && (
            <ScheduleScreen
              onPreviewClick={(s) => handleClassClick([s], s.description, 'facilities', s.instructor)}
              refreshKey={refreshKey}
              currentUserId={currentUserId}
              parentMode={userProfile.role === 'parent'}
              myChildren={myChildren}
            />
          )}

          {/* ... existing screens ... */}

          {activeTab === 'qr' && <QRScreen credits={userProfile.credits || 0} currentUserId={currentUserId} subscriptionStatus={userProfile.subscription_status} accountStatus={userProfile.account_status} />}
        </main>

        <BottomNav activeTab={activeTab} setTab={setActiveTab} />

        {showClassModal && (
          <ClassModal
            sessions={selectedSessions}
            currentUserId={currentUserId}
            bookedSessions={bookedSessions}
            onClose={() => {
              setShowClassModal(false);
              setSelectedServiceDescription(null);
              setSelectedCoachName(null);
              setSelectedCoachBio(null);
              setSelectedOrigin('facilities');
              setSelectedInitialSessionId(null);
              setSelectedAttendeeId(null);
            }}
            onScheduleChange={() => setRefreshKey(k => k + 1)}
            serviceDescription={selectedServiceDescription}
            origin={selectedOrigin}
            coachName={selectedCoachName || undefined}
            coachBio={selectedCoachBio || undefined}
            initialSessionId={selectedInitialSessionId || undefined}
            initialAttendeeId={selectedAttendeeId || undefined}
          />
        )}

        {showSettingsModal && (
          <SettingsModal
            onClose={() => setShowSettingsModal(false)}
            onLogout={handleLogout}
            profileData={userProfile}
            setProfileData={setUserProfile}
            onSave={handleSaveProfile}
            onShowHistory={() => {
              setShowSettingsModal(false);
              setShowHistoryModal(true);
            }}
          />
        )}

        {showHistoryModal && (
          <TransactionHistoryModal onClose={() => setShowHistoryModal(false)} />
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
    <Suspense fallback={<div className="bg-black h-screen text-white flex justify-center items-center font-montserrat font-black italic uppercase tracking-widest animate-pulse">Loading...</div>}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Suspense>
  );
}