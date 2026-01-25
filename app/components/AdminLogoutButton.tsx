'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Force full reload to clear all client state/cache
        window.location.href = '/';
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white group"
        >
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Logout</span>
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
    );
}
