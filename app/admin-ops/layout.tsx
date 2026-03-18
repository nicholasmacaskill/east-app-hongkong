'use client';
import React, { useEffect, useState } from 'react';
import { Shield, Newspaper, QrCode, Calendar, Home, CreditCard, BarChart3, HelpCircle, Users, LayoutGrid, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { fetchProfileResilient } from '@/app/lib/authProfile';
import AdminLogoutButton from '../components/AdminLogoutButton';

const AdminNavLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    return (
        <Link href={href} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            <Icon size={16} />
            {label}
        </Link>
    );
};

export default function AdminOpsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.replace('/');
                    return;
                }
                const profile = await fetchProfileResilient(user.id, { select: 'role' });
                if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
                    router.replace('/');
                } else {
                    setAuthorized(true);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                router.replace('/');
            }
        };
        checkAuth();
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
            <header className="bg-[#1e1e1e] border-b border-white/10 py-5 px-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/east-logo-transparent.png" alt="EAST Logo" className="h-14 w-auto object-contain" />
                        <div className="bg-[#28D160] text-black text-[10px] font-bold px-2 py-1 rounded uppercase">
                            Ops Panel
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6 mr-6 border-r border-white/10 pr-6">
                            <AdminNavLink href="/admin-ops" icon={Home} label="Ops Home" />
                            <AdminNavLink href="/admin-ops/coaches" icon={Users} label="Coaches" />
                            <AdminNavLink href="/admin-ops/services" icon={LayoutGrid} label="Services" />
                            <AdminNavLink href="/admin-ops/schedule" icon={Calendar} label="Schedule" />
                            <AdminNavLink href="/admin-ops/bookings" icon={ClipboardList} label="Booking Log" />
                        </div>
                        <AdminLogoutButton />
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
