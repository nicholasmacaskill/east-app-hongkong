import React from 'react';
import { Shield, Newspaper, QrCode } from 'lucide-react';
import Link from 'next/link';
import AdminLogoutButton from '../components/AdminLogoutButton';

// Helper Component for Sidebar Links
const AdminNavLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    // Only use client-side hooks if we convert layout to client, but simpler to just use Link for now or make it client
    // Since we need active state logic, let's assume we want this.
    // However, layout.tsx is usually server component. Let's make a client wrapper or just simple links.
    // For simplicity/speed in MVP, we'll just style it simply.
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
                            <AdminNavLink href="/sys-admin/qr" icon={QrCode} label="QR Codes" />
                            <AdminNavLink href="/sys-admin/news" icon={Newspaper} label="News" />
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
