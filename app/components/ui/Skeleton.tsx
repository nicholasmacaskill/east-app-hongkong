'use client';
import React from 'react';

export default function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`bg-white/5 animate-pulse rounded-2xl ${className}`} />
    );
}
