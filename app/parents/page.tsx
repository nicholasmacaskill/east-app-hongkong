'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

// Screens
import HomeScreen from '@/app/components/screens/HomeScreen';
import ScheduleScreen from '@/app/components/screens/ScheduleScreen';
import CommunityScreen from '@/app/components/CommunityScreen';
import ParentProfile from '@/app/components/screens/ParentProfile';
import QRScreen from '@/app/components/screens/QRScreen';
import AuthScreen from '@/app/auth/AuthScreen';
import BottomNav from '@/app/components/BottomNav';

// Modals
import ClassModal from '@/app/components/modals/ClassModal';
import SettingsModal from '@/app/components/modals/SettingsModal';

import type { UserRole, Tab } from '@/app/types';
import { Session } from '@/app/types/session';

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
    id?: string;
}

const initialProfileData: UserProfileData = {
    name: '', surname: '', first_name: '', last_name: '', username: '', bio: '', email: '', mobile: '', avatar_url: '', credits: 0, gallery_images: [], schedule_photo_url: '', role: 'parent'
};

function ParentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // App State
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
    const [bookedSessionIds, setBookedSessionIds] = useState<number[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const [userProfile, setUserProfile] = useState<UserProfileData>(initialProfileData);
    const [myChildren, setMyChildren] = useState<any[]>([]);
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);

    // Fetch children helper
    const fetchChildren = async (parentId: string) => {
        setIsLoadingChildren(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('parent_id', parentId);

        if (data && data.length > 0) {
            setMyChildren(data);
            // Default to first child if none selected
            if (!activeChildId) setActiveChildId(data[0].id);
        }
        setIsLoadingChildren(false);
    };

    // 1. Auth & Data Fetch
    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    setCurrentUserId(user.id);

                    // FETCH REAL PROFILE DATA
                    const { data: profileData } = await supabase
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
                            role: profileData.role as UserRole,
                            id: profileData.id
                        });

                        // FETCH CHILDREN
                        fetchChildren(user.id);
                    }

                    // FETCH BOOKINGS
                    try {
                        const res = await fetch(`/api/my-schedule?userId=${user.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (Array.isArray(data)) {
                                setBookedSessionIds(data.map((s: Session) => s.id));
                            }
                        }
                    } catch (fetchError) {
                        console.error("Error fetching schedule:", fetchError);
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
            return ['home', 'profile', 'qr', 'schedule', 'community'].includes(t);
        };
        if (targetTab && isTab(targetTab)) {
            setActiveTab(targetTab);
        }
    }, [searchParams]);

    // Check for success param from Stripe redirect
    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setRefreshKey(prev => prev + 1);
            router.replace('/parents');
            alert("Purchase Successful! Credits added.");
        }
    }, [searchParams, router]);

    const handleSaveProfile = async (updatedData: UserProfileData) => {
        if (!currentUserId) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: updatedData.first_name,
                last_name: updatedData.last_name,
                username: updatedData.username,
                bio: updatedData.bio,
                mobile: updatedData.mobile,
                contact_email: updatedData.email,
                avatar_url: updatedData.avatar_url,
                gallery_images: updatedData.gallery_images
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    if (loading) return <div className="bg-black h-screen text-white flex justify-center items-center font-montserrat font-bold uppercase tracking-tighter">Loading App...</div>;

    if (!currentUserId) return <AuthScreen onAuthSuccess={() => window.location.reload()} />;

    return (
        <div className="min-h-screen bg-black text-white font-opensans select-none">
            <div className="max-w-md mx-auto bg-black min-h-screen relative border-x border-gray-900 shadow-2xl">
                <main>
                    {activeTab === 'home' && (
                        <HomeScreen
                            credits={userProfile.credits}
                            onClassClick={(s) => { setSelectedSessions(s); setShowClassModal(true); }}
                            bookedSessionIds={bookedSessionIds}
                            onOpenSettings={() => setShowSettingsModal(true)}
                            setTab={setActiveTab}
                        />
                    )}

                    {activeTab === 'profile' && (
                        <ParentProfile
                            onOpenSettings={() => setShowSettingsModal(true)}
                            profileData={userProfile}
                            myChildren={myChildren}
                            activeChildId={activeChildId}
                            setActiveChildId={setActiveChildId}
                            onAddChild={() => fetchChildren(currentUserId!)}
                        />
                    )}

                    {activeTab === 'schedule' && (
                        <ScheduleScreen
                            currentUserId={activeChildId || currentUserId}
                            refreshKey={refreshKey}
                            onPreviewClick={(s) => { setSelectedSessions([s]); setShowClassModal(true); }}
                            parentMode={true}
                            myChildren={myChildren}
                            activeChildId={activeChildId}
                            setActiveChildId={setActiveChildId}
                        />
                    )}

                    {activeTab === 'community' && <CommunityScreen key={refreshKey} currentUserId={currentUserId} />}

                    {activeTab === 'qr' && <QRScreen credits={userProfile.credits || 0} currentUserId={currentUserId} />}
                </main>

                <BottomNav activeTab={activeTab} setTab={setActiveTab} />

                {showClassModal && (
                    <ClassModal
                        sessions={selectedSessions}
                        currentUserId={currentUserId}
                        bookedSessionIds={bookedSessionIds}
                        onClose={() => setShowClassModal(false)}
                        onScheduleChange={() => setRefreshKey(k => k + 1)}
                        initialAttendeeId={activeChildId}
                    />
                )}

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

export default function ParentsPage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen text-white flex justify-center items-center font-montserrat font-bold uppercase tracking-tighter">Loading App...</div>}>
            <ParentsContent />
        </Suspense>
    );
}
