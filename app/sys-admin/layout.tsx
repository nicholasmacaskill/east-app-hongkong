'use client';
import React, { useEffect, useState } from 'react';
import { Shield, Newspaper, QrCode, Calendar, Home, CreditCard, BarChart3, HelpCircle } from 'lucide-react';
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
            <header className="bg-[#1e1e1e] border-b border-white/10 py-5 px-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/east-logo-transparent.png" alt="EAST Logo" className="h-14 w-auto object-contain" />
                        <div className="bg-[#28D160] text-black text-[10px] font-bold px-2 py-1 rounded uppercase">
                            Admin
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-6 mr-6 border-r border-white/10 pr-6">
                            <AdminNavLink href="/sys-admin" icon={Home} label="Dashboard" />
                            <AdminNavLink href="/sys-admin/schedule" icon={Calendar} label="Schedule" />
                            <AdminNavLink href="/sys-admin/qr" icon={QrCode} label="Check-In" />
                            <AdminNavLink href="/sys-admin/news" icon={Newspaper} label="News" />
                            <AdminNavLink href="/sys-admin/bookings" icon={CreditCard} label="Booking Logs" />
                            <AdminNavLink href="/sys-admin/audit" icon={Shield} label="Audit Logs" />
                            <AdminNavLink href="/sys-admin/metrics" icon={BarChart3} label="Metrics" />
                            <AdminNavLink href="/faq?tab=admin" icon={HelpCircle} label="Admin Guide" />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <MobileMenu />
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}

function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="md:hidden relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
            >
                <div className="space-y-1.5">
                    <div className={`w-5 h-0.5 bg-current transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                    <div className={`w-5 h-0.5 bg-current transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
                    <div className={`w-5 h-0.5 bg-current transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-4 w-64 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn z-[100]">
                    <div className="flex flex-col py-3 gap-1">
                        <Link
                            href="/sys-admin"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
                        >
                            <Home size={16} /> Dashboard
                        </Link>
                        <Link
                            href="/sys-admin/schedule"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
                        >
                            <Calendar size={16} /> Schedule
                        </Link>
                        <Link
                            href="/sys-admin/qr"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
                        >
                            <QrCode size={16} /> Check-In
                        </Link>
                        <Link
                            href="/sys-admin/news"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
                        >
                            <Newspaper size={16} /> News
                        </Link>
                        <Link
                            href="/sys-admin/bookings"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
                        >
                            <CreditCard size={16} /> Booking Logs
                        </Link>
                        <Link
                            href="/sys-admin/audit"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
                        >
                            <Shield size={16} /> Audit Logs
                        </Link>
                        <Link
                            href="/sys-admin/metrics"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
                        >
                            <BarChart3 size={16} /> Metrics
                        </Link>
                        <Link
                            href="/faq?tab=admin"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-4 hover:bg-white/5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-east-light hover:text-white transition-colors border-t border-white/5 mt-1"
                        >
                            <HelpCircle size={16} /> Admin Guide
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}