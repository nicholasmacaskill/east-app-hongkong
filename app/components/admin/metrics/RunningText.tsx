'use client';

import React from 'react';

interface RunningTextProps {
    text: string;
    speed?: number;
    className?: string;
}

export default function RunningText({
    text,
    speed = 20,
    className = ''
}: RunningTextProps) {
    return (
        <div className={`overflow-hidden whitespace-nowrap pointer-events-none select-none ${className}`}>
            <div
                className="inline-block animate-marquee"
                style={{
                    animationDuration: `${speed}s`,
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite'
                }}
            >
                <span className="mx-4">{text}</span>
                <span className="mx-4">{text}</span>
                <span className="mx-4">{text}</span>
                <span className="mx-4">{text}</span>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    display: inline-block;
                    padding-left: 100%;
                    animation: marquee linear infinite;
                }
            `}</style>
        </div>
    );
}
