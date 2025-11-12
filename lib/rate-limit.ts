import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

/**
 * Rate Limiting Configuration
 *
 * Creates rate limiters for different endpoint types with appropriate limits:
 * - Chat: 20 requests per minute per IP (generous for user experience)
 * - Extract: 10 requests per minute per IP (protects against SSRF scanning)
 * - Admin: 5 requests per minute per IP (protects against brute force)
 *
 * Note: Rate limiting is optional and only enabled if KV environment variables are configured.
 * In local development without KV, rate limiting is automatically disabled.
 */

// Check if KV is configured (required env vars are present)
const isKVConfigured = Boolean(
  process.env.crafted_KV_REST_API_URL &&
  process.env.crafted_KV_REST_API_TOKEN
);

// Chat endpoint: 20 requests per minute per IP (only if KV configured)
export const chatRateLimit = isKVConfigured ? new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:chat',
}) : null;

// Extract endpoint: 10 requests per minute per IP (only if KV configured)
export const extractRateLimit = isKVConfigured ? new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:extract',
}) : null;

// Admin endpoints: 5 requests per minute per IP (only if KV configured)
export const adminRateLimit = isKVConfigured ? new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:admin',
}) : null;

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
 * Returns null if rate limit is not exceeded or if rate limiting is disabled
 */
export async function checkRateLimit(
  ratelimit: Ratelimit | null,
  identifier: string
): Promise<Response | null> {
  // If rate limiting is not configured (local dev), allow all requests
  if (!ratelimit) {
    console.log('[Rate Limit] Disabled (KV not configured)');
    return null;
  }

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
