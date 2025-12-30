'use client';
import React, { use } from 'react';
import { MOCK_PLAYERS } from '@/app/stats/mockData';
import PlayerProfile from '@/app/components/screens/PlayerProfile';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const playerId = parseInt(resolvedParams.id);
    const player = MOCK_PLAYERS.find(p => p.id === playerId);

    if (!player) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 font-montserrat">
                <h1 className="text-2xl font-black italic">PLAYER NOT FOUND</h1>
                <Link href="/stats" className="text-[#28D160] font-bold underline">Return to Stats</Link>
            </div>
        );
    }

    // Map Mock Data to Profile Data Structure
    const nameParts = player.name.split(' ');
    const firstName = nameParts[0];
    const surname = nameParts.slice(1).join(' ');

    const profileData = {
        name: firstName,
        surname: surname,
        username: player.team.toLowerCase() + '_' + firstName.toLowerCase(),
        bio: `Player for the ${player.team}.`,
        avatar_url: player.avatar,
        email: '',
        mobile: '',
        gallery_images: [],
        credits: 0,
    };

    // Construct full stats object from simplified mock
    const playerStats = {
        age: 25, // Mock age
        season: 1,
        team: player.team,
        games_played_season: player.stats.gp,
        games_played_total: player.stats.gp, // Mock
        games_missed_healthy: 0,
        games_missed_injured: 0,
        goals_season: player.stats.goals,
        goals_total: player.stats.goals, // Mock
        assists_season: player.stats.assists,
        assists_total: player.stats.assists, // Mock
    };

    return (
        <div className="min-h-screen bg-black text-white font-opensans select-none">
            <div className="max-w-md mx-auto bg-black min-h-screen relative border-x border-gray-900 shadow-2xl">
                {/* Back Button Overlay */}
                <Link href="/stats" className="absolute top-6 left-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-[#28D160] hover:text-black transition-colors backdrop-blur-md">
                    <ChevronLeft size={24} />
                </Link>

                <PlayerProfile
                    onOpenSettings={() => { }}
                    profileData={profileData}
                    stats={playerStats}
                    isReadOnly={true}
                />
            </div>
        </div>
    );
}
