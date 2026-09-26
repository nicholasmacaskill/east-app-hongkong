'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, ExternalLink, Loader2 } from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeDirectUrl } from '@/app/lib/youtubeUtils';

export interface YouTubePlayerRef {
    seekTo: (seconds: number) => void;
    getCurrentTime: () => number;
    playVideo: () => void;
    pauseVideo: () => void;
}

interface YouTubePlayerProps {
    videoId: string;
    initialStartSeconds?: number;
    onTimeUpdate?: (seconds: number) => void;
    onPlayerReady?: () => void;
    autoPlay?: boolean;
    className?: string;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({
    videoId,
    initialStartSeconds = 0,
    onTimeUpdate,
    onPlayerReady,
    autoPlay = true,
    className = ''
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const timeTrackerInterval = useRef<any>(null);
    const [isApiReady, setIsApiReady] = useState(false);
    const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialStartSeconds);
    const [embedFallback, setEmbedFallback] = useState(false);

    // Load YouTube IFrame Player API
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (window.YT && window.YT.Player) {
            setIsApiReady(true);
            return;
        }

        // Check if script already injected
        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api';
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (prevCallback) prevCallback();
            setIsApiReady(true);
        };

        // Fallback after 4 seconds if YouTube API is blocked/slow
        const timeout = setTimeout(() => {
            if (!isPlayerLoaded) {
                setEmbedFallback(true);
            }
        }, 4000);

        return () => clearTimeout(timeout);
    }, []);

    // Initialize player when API is ready and videoId changes
    useEffect(() => {
        if (!isApiReady || !videoId || embedFallback || !mountRef.current) return;

        try {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    // Ignore destroy error
                }
            }

            // Create a non-React-managed placeholder inside mountRef
            mountRef.current.innerHTML = '';
            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-full';
            mountRef.current.appendChild(placeholder);

            playerRef.current = new window.YT.Player(placeholder, {
                videoId: videoId,
                playerVars: {
                    autoplay: autoPlay ? 1 : 0,
                    start: Math.floor(initialStartSeconds),
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: typeof window !== 'undefined' ? window.location.origin : ''
                },
                events: {
                    onReady: (event: any) => {
                        setIsPlayerLoaded(true);
                        if (initialStartSeconds > 0) {
                            event.target.seekTo(initialStartSeconds, true);
                        }
                        if (onPlayerReady) onPlayerReady();
                    },
                    onStateChange: (event: any) => {
                        // 1 = playing, 2 = paused
                        if (event.data === 1) {
                            startTimeTracking();
                        } else {
                            stopTimeTracking();
                        }
                    },
                    onError: (err: any) => {
                        console.warn('YouTube Player API Error, falling back to embed:', err);
                        setEmbedFallback(true);
                    }
                }
            });
        } catch (err) {
            console.warn('Failed to init YT player, falling back to iframe:', err);
            setEmbedFallback(true);
        }

        return () => {
            stopTimeTracking();
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    // ignore
                }
                playerRef.current = null;
            }
            if (mountRef.current) {
                mountRef.current.innerHTML = '';
            }
        };
    }, [isApiReady, videoId, embedFallback]);

    const startTimeTracking = () => {
        stopTimeTracking();
        timeTrackerInterval.current = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
                if (onTimeUpdate) onTimeUpdate(time);
            }
        }, 500);
    };

    const stopTimeTracking = () => {
        if (timeTrackerInterval.current) {
            clearInterval(timeTrackerInterval.current);
            timeTrackerInterval.current = null;
        }
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        seekTo: (seconds: number) => {
            setCurrentTime(seconds);
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(seconds, true);
                try {
                    playerRef.current.playVideo();
                } catch (e) {
                    // ignore
                }
            } else if (embedFallback) {
                // In fallback mode, reload iframe with start parameter
                const iframe = containerRef.current?.querySelector('iframe');
                if (iframe) {
                    iframe.src = getYouTubeEmbedUrl(videoId, seconds);
                }
            }
        },
        getCurrentTime: () => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                return playerRef.current.getCurrentTime();
            }
            return currentTime;
        },
        playVideo: () => {
            if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                playerRef.current.playVideo();
            }
        },
        pauseVideo: () => {
            if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                playerRef.current.pauseVideo();
            }
        }
    }), [embedFallback, videoId, currentTime]);

    return (
        <div ref={containerRef} className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${className}`}>
            {!embedFallback ? (
                <>
                    <div ref={mountRef} className="w-full h-full" />
                    {!isPlayerLoaded && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-east-light animate-spin" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                Loading Video Stream...
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <iframe
                    src={getYouTubeEmbedUrl(videoId, initialStartSeconds)}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            )}
        </div>
    );
});

YouTubePlayer.displayName = 'YouTubePlayer';
export default YouTubePlayer;
