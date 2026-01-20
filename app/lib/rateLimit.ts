import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client
// Note: You'll need to add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your environment variables
const redis = process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

// Create rate limiters with different limits for different endpoints
export const authRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
        analytics: true,
        prefix: 'ratelimit:auth',
    })
    : null;

export const paymentRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
        analytics: true,
        prefix: 'ratelimit:payment',
    })
    : null;

export const apiRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
        analytics: true,
        prefix: 'ratelimit:api',
    })
    : null;

export const strictRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute (for sensitive operations)
        analytics: true,
        prefix: 'ratelimit:strict',
    })
    : null;

/**
 * Helper function to check rate limit and return appropriate response
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param rateLimit - The rate limiter to use
 * @returns { success: boolean, response?: Response }
 */
export async function checkRateLimit(
    identifier: string,
    rateLimit: Ratelimit | null
): Promise<{ success: boolean; response?: Response }> {
    if (!rateLimit) {
        // If Redis is not configured, allow the request (development mode)
        return { success: true };
    }

    const { success, limit, reset, remaining } = await rateLimit.limit(identifier);

    if (!success) {
        return {
            success: false,
            response: new Response(
                JSON.stringify({
                    error: 'Too many requests',
                    message: 'Please try again later',
                    retryAfter: Math.floor((reset - Date.now()) / 1000),
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': new Date(reset).toISOString(),
                        'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
                    },
                }
            ),
        };
    }

    return { success: true };
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: Request, userId?: string): string {
    if (userId) return userId;

    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    // Fallback to a generic identifier
    return 'anonymous';
}
