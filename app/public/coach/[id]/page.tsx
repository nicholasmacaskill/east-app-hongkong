'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import CoachProfile from '@/app/components/screens/CoachProfile';

export default function PublicCoachProfilePage() {
    const { id } = useParams();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Profile not found');

                // Map database columns to the format expected by CoachProfile
                setProfileData({
                    id: data.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    username: data.username,
                    bio: data.bio,
                    avatar_url: data.avatar_url,
                    gallery_images: data.gallery_images || [],
                    intro_video_url: data.intro_video_url,
                    role: data.role
                });
            } catch (err: any) {
                console.error('Error fetching public profile:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white font-montserrat font-bold animate-pulse uppercase tracking-widest">
                Loading Profile...
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-montserrat p-4 text-center">
                <h1 className="text-2xl font-black italic uppercase mb-4">Profile Not Found</h1>
                <p className="text-gray-500 uppercase tracking-widest text-xs">The requested coach profile could not be loaded.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <CoachProfile
                onOpenSettings={() => { }} // No-op for public view
                profileData={profileData}
                isPublic={true}
            />
        </div>
    );
}
