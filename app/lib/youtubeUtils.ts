/**
 * Utility functions for YouTube URL parsing, timestamp conversions,
 * thumbnail generation, and embed URL creation for Film Room sessions.
 */

export function extractYouTubeVideoId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    // Raw 11-character video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    try {
        // Handle URLs with or without protocol
        const normalizedUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
            ? trimmed
            : `https://${trimmed}`;

        const parsed = new URL(normalizedUrl);
        const hostname = parsed.hostname.toLowerCase();

        // youtu.be/<id>
        if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
            const pathname = parsed.pathname.replace(/^\//, '');
            const id = pathname.split('/')[0];
            return id && id.length === 11 ? id : null;
        }

        // youtube.com (watch, embed, shorts, v, etc.)
        if (hostname.includes('youtube.com')) {
            // /watch?v=<id>
            const vParam = parsed.searchParams.get('v');
            if (vParam && vParam.length === 11) {
                return vParam;
            }

            // /embed/<id>
            const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
            if (embedMatch) return embedMatch[1];

            // /shorts/<id>
            const shortsMatch = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (shortsMatch) return shortsMatch[1];

            // /v/<id>
            const vMatch = parsed.pathname.match(/\/v\/([a-zA-Z0-9_-]{11})/);
            if (vMatch) return vMatch[1];
        }
    } catch {
        // Fallback regex in case of non-standard URL strings
        const regexMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/);
        if (regexMatch) {
            return regexMatch[1];
        }
    }

    return null;
}

export function formatSecondsToLabel(totalSeconds: number): string {
    const secs = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    }
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
}

export function parseLabelToSeconds(label: string): number {
    if (!label) return 0;
    const parts = label.trim().split(':').map((p) => parseInt(p, 10));

    if (parts.some((p) => isNaN(p))) {
        const raw = parseInt(label.replace(/\D/g, ''), 10);
        return isNaN(raw) ? 0 : raw;
    }

    if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // SS
        return parts[0];
    }

    return 0;
}

export function getYouTubeThumbnail(videoId: string): string {
    if (!videoId) return '';
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string, startSeconds = 0): string {
    if (!videoId) return '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&playsinline=1&modestbranding=1&start=${Math.floor(startSeconds)}`;
}

export function getYouTubeDirectUrl(videoId: string, startSeconds = 0): string {
    if (!videoId) return '';
    const startParam = startSeconds > 0 ? `?t=${Math.floor(startSeconds)}` : '';
    return `https://youtu.be/${videoId}${startParam}`;
}
