'use client';
import React, { Suspense } from 'react';
import DrillHubScreen from '@/app/components/screens/DrillHubScreen';

export default function DrillHubPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-montserrat uppercase font-black tracking-widest text-xs animate-pulse">Loading Hub...</div>}>
            <DrillHubScreen />
        </Suspense>
    );
}
