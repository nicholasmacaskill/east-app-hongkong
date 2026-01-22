'use client';
import React, { useEffect, useState } from 'react';
import { Shield, Newspaper, QrCode, Calendar, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
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
                console.log('[Admin Layout] Starting auth check...');

                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError) {
                    console.error('[Admin Layout] Error fetching user:', userError);
                    router.replace('/');
                    return;
                }

                if (!user) {
                    console.log('[Admin Layout] No user found, retrying...');
                    // Wait a tiny bit and try one more time as session might be restoring
                    await new Promise(r => setTimeout(r, 500));
                    const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser();

                    if (retryError || !retryUser) {
                        console.error('[Admin Layout] Retry failed, redirecting to home');
                        router.replace('/');
                        return;
                    }
                    // If found on retry, continue with that user
                    await processUser(retryUser);
                    return;
                }
                await processUser(user);
            } catch (error) {
                console.error('[Admin Layout] Unexpected error during auth check:', error);
                router.replace('/');
            }
        };

        const processUser = async (user: any) => {
            try {
                console.log('[Admin Layout] Processing user:', user.id);

                const metaRole = user.user_metadata?.role;
                console.log('[Admin Layout] User metadata role:', metaRole);

                if (metaRole === 'admin' || metaRole === 'sys-admin') {
                    console.log('[Admin Layout] ✅ Authorized via metadata');
                    setAuthorized(true);
                    return;
                }

                console.log('[Admin Layout] Checking profile table...');
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('[Admin Layout] Profile fetch error:', profileError);
                    router.replace('/');
                    return;
                }

                console.log('[Admin Layout] Profile role:', profile?.role);

                if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
                    console.warn('[Admin Layout] ❌ Unauthorized - redirecting');
                    router.replace('/');
                } else {
                    console.log('[Admin Layout] ✅ Authorized via profile');
                    setAuthorized(true);
                }
            } catch (error) {
                console.error('[Admin Layout] Error processing user:', error);
                router.replace('/');
            }
        };

        // Set a timeout fallback - if auth check takes more than 5 seconds, redirect
        timeoutId = setTimeout(() => {
            console.error('[Admin Layout] ⏱️ Auth check timeout - redirecting to home');
            router.replace('/');
        }, 5000);

        checkAuth().finally(() => {
            clearTimeout(timeoutId);
        });

        return () => {
            clearTimeout(timeoutId);
        };
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
                        <div className="hidden sm:flex items-center gap-8 mr-4 border-r border-white/10 pr-8">
                            <AdminNavLink href="/sys-admin" icon={Home} label="Admin Home" />
                            <AdminNavLink href="/sys-admin/qr" icon={QrCode} label="QR Codes" />
                            <AdminNavLink href="/sys-admin/news" icon={Newspaper} label="News" />
                            <AdminNavLink href="/sys-admin/schedule?category=EVENT" icon={Calendar} label="Events" />
                        </div>
                        <AdminLogoutButton />
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
