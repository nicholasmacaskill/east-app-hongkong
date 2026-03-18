'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthScreen from '../auth/AuthScreen';
import type { UserRole } from '../types';

export default function AdminLoginPage() {
    const router = useRouter();

    // Check if user is already logged in
    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'admin' || storedRole === 'sys-admin') {
            router.replace('/admin-ops');
        } else if (storedRole) {
            router.replace('/');
        }
    }, [router]);

    // Handle success
    const handleAuthSuccess = (role: UserRole) => {
        localStorage.setItem('userRole', role);
        if (role === 'admin' || role === 'sys-admin') {
            router.push('/admin-ops');
        } else {
            // Non-admins shouldn't really use this page, but if they do, toss them to the regular dashboard
            router.push('/');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black">
            <AuthScreen
                onAuthSuccess={handleAuthSuccess}
                expectedRole="admin"
                initialStep="login"
            />
        </div>
    );
}
