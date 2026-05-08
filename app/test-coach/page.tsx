'use client';
import CoachProfile from '@/app/components/screens/CoachProfile';

export default function TestCoachPage() {
    const profileData = {
        id: "49c1adb9-31a3-48a2-8768-b6b84164e83d",
        role: "coach",
        first_name: "Coach",
        last_name: "Test",
        team: "EAST ELITE",
        bio: "Test coach for drill hub."
    };

    return (
        <div className="bg-black min-h-screen text-white">
            <CoachProfile 
                onOpenSettings={() => {}} 
                profileData={profileData} 
                isPublic={false} 
                currentUserId="49c1adb9-31a3-48a2-8768-b6b84164e83d" 
            />
        </div>
    );
}
