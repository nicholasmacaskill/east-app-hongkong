'use client';
import CoachDashboard from '@/app/components/screens/CoachDashboard';

export default function TestDashboardPage() {
    return (
        <div className="bg-black min-h-screen text-white">
            <CoachDashboard 
                currentUserId="test-user-id"
                userName="Test"
                userLastName="Coach"
            />
        </div>
    );
}
