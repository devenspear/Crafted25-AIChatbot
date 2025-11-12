import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

/**
 * Rate Limiting Configuration
 *
 * Creates rate limiters for different endpoint types with appropriate limits:
 * - Chat: 20 requests per minute per IP (generous for user experience)
 * - Extract: 10 requests per minute per IP (protects against SSRF scanning)
 * - Admin: 5 requests per minute per IP (protects against brute force)
 */

// Chat endpoint: 20 requests per minute per IP
export const chatRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:chat',
});

// Extract endpoint: 10 requests per minute per IP
export const extractRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:extract',
});

// Admin endpoints: 5 requests per minute per IP
export const adminRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:admin',
});

/**
 * Get client IP address from request
 * Handles various proxy headers for accurate rate limiting
 */
export function getClientIP(req: Request): string {
  // Try to get real IP from common proxy headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be: "client, proxy1, proxy2"
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (should not happen on Vercel)
  return 'unknown';
}

/**
 * Check rate limit and return appropriate response if exceeded
 * Returns null if rate limit is not exceeded
 */
export async function checkRateLimit(
  ratelimit: Ratelimit,
  identifier: string
): Promise<Response | null> {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    const resetDate = new Date(reset);
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        limit,
        remaining: 0,
        reset: resetDate.toISOString(),
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}
