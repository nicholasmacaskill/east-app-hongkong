'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import PlayerProfile from '@/app/components/screens/PlayerProfile';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const playerId = resolvedParams.id;
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!playerId) return;

      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', playerId)
          .single();

        if (profileError) throw profileError;
        if (!data) throw new Error('Profile not found');

        setProfileData({
          id: data.id,
          name: data.first_name,
          surname: data.last_name,
          username: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url,
          gallery_images: data.gallery_images || [],
          credits: data.credits,
          role: data.role,
        });
      } catch (err: any) {
        console.error('Error fetching player profile:', err);
        setError(err.message || 'Profile not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-montserrat font-bold animate-pulse uppercase tracking-widest">
        Loading Player Profile...
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 font-montserrat p-4 text-center">
        <h1 className="text-2xl font-black italic uppercase">Player Not Found</h1>
        <p className="text-gray-500 uppercase tracking-widest text-xs">
          The requested player profile could not be loaded.
        </p>
        <Link href="/stats" className="text-[#28D160] font-bold underline">
          Return to Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-opensans select-none">
      <div className="max-w-md mx-auto bg-black min-h-screen relative border-x border-gray-900 shadow-2xl">
        <Link
          href="/stats"
          className="absolute top-6 left-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-[#28D160] hover:text-black transition-colors backdrop-blur-md"
        >
          <ChevronLeft size={24} />
        </Link>

        <PlayerProfile
          onOpenSettings={() => {}}
          profileData={profileData}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}