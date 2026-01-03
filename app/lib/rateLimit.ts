// Simple in-memory rate limiter for API routes
// For production, consider Redis-based solution

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

export function rateLimit(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    // Clean up expired entries periodically
    if (rateLimitMap.size > 10000) {
        for (const [key, value] of rateLimitMap.entries()) {
            if (value.resetTime < now) {
                rateLimitMap.delete(key);
            }
        }
    }

    if (!record || record.resetTime < now) {
        // New window
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return true;
    }

    if (record.count >= config.maxRequests) {
        return false;  // Rate limit exceeded
    }

    record.count++;
    return true;
}

// Helper to get identifier from request (IP + user ID if available)
export function getRateLimitIdentifier(request: Request, userId?: string): string {
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
    return userId ? `${ip}:${userId}` : ip;
}
