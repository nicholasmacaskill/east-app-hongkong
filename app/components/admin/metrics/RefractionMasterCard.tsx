'use client';

import React from 'react';

interface RefractionMasterCardProps {
    children: React.ReactNode;
    momentum?: 'cyan' | 'magenta' | 'none';
    className?: string;
    onClick?: () => void;
}

export default function RefractionMasterCard({
    children,
    momentum = 'none',
    className = '',
    onClick
}: RefractionMasterCardProps) {
    const momentumClass = momentum === 'cyan' ? 'momentum-cyan' : momentum === 'magenta' ? 'momentum-magenta' : '';

    return (
        <div
            onClick={onClick}
            className={`
                glass-panel 
                rounded-2xl 
                p-6 
                relative 
                transition-all 
                duration-500 
                ease-[cubic-bezier(0.17,0.67,0.83,0.67)]
                hover:scale-[1.02] 
                hover:border-white/20 
                group
                cursor-pointer
                ${momentumClass}
                ${className}
            `}
            style={{
                // Spring-like feel using CSS transitions
                // Stiffness: 100, Damping: 30 approximation
            }}
        >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
