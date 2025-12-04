'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// ✅ Import AuthScreen here (this is the correct place)
import AuthScreen from '../auth/AuthScreen'; 
import type { UserRole } from '../types';

export default function LoginPage() {
    const router = useRouter();
    
    // Check if user is already logged in
    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
            router.replace('/');
        }
    }, [router]);

    // Handle success
    const handleAuthSuccess = (role: UserRole) => {
        localStorage.setItem('userRole', role);
        router.push('/'); 
    };

    return (
        <div className="flex flex-col min-h-screen bg-black">
            <AuthScreen 
                onAuthSuccess={handleAuthSuccess} 
            />
        </div>
    );
}