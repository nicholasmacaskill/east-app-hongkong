'use client';
import React, { useEffect, useState } from 'react';
import { Shield, Newspaper, QrCode, Calendar, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { fetchProfileResilient } from '@/app/lib/authProfile'; // Added resilient fetch
import AdminLogoutButton from '../components/AdminLogoutButton';

// Helper Component for Sidebar Links
const AdminNavLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    return (
        <Link href={href} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            <Icon size={16} />
            {label}
        </Link>
    );
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    await new Promise(r => setTimeout(r, 500));
                    const { data: { user: retryUser } } = await supabase.auth.getUser();
                    if (!retryUser) {
                        router.replace('/');
                        return;
                    }
                    await processUser(retryUser);
                    return;
                }
                await processUser(user);
            } catch (error) {
                console.error("Auth check failed:", error);
                router.replace('/');
            }
        };

        const processUser = async (user: any) => {
            const metaRole = user.user_metadata?.role;
            if (metaRole === 'admin' || metaRole === 'sys-admin') {
                setAuthorized(true);
                return;
            }

            // Use the resilient fetch instead of the single direct query
            const profile = await fetchProfileResilient(user.id, { select: 'role' });

            if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
                router.replace('/');
            } else {
                setAuthorized(true);
            }
        };

        timeoutId = setTimeout(() => {
            console.error("Admin auth timeout - redirecting");
            router.replace('/');
        }, 8000); // Increased timeout to give resilient fetch more time

        checkAuth().finally(() => {
            clearTimeout(timeoutId);
        });

        return () => clearTimeout(timeoutId);
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#28D160] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#28D160]">Verifying Access...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-montserrat">
            <header className="bg-[#1e1e1e] border-b border-white/10 p-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-black italic text-2xl tracking-tighter text-white">EAST</span>
                        <div className="bg-[#28D160] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Admin
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-6 mr-6 border-r border-white/10 pr-6">
                            <AdminNavLink href="/sys-admin" icon={Home} label="Dashboard" />
                            <AdminNavLink href="/sys-admin/schedule" icon={Calendar} label="Schedule" />
                            <AdminNavLink href="/sys-admin/qr" icon={QrCode} label="Check-In" />
                            <AdminNavLink href="/sys-admin/news" icon={Newspaper} label="News" />
                        </div>
                        <AdminLogoutButton />
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}