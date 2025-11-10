/**
 * Analytics & Usage Tracking Library
 *
 * Tracks chatbot usage metrics using Vercel KV (Redis)
 * - Message counts
 * - Session tracking
 * - Response times
 * - Token usage & costs
 * - Popular queries
 * - Error tracking
 */

import { kv } from '@vercel/kv';

// Type definitions
export interface MessageStats {
  total: number;
  today: number;
  thisHour: number;
}

export interface SessionStats {
  total: number;
  active: number;
}

export interface ResponseTimeStats {
  avg: number;
  min: number;
  max: number;
  count: number;
}

export interface TokenStats {
  input: number;
  output: number;
  total: number;
  cost: number;
}

export interface ErrorStats {
  total: number;
  recent: Array<{
    message: string;
    timestamp: string;
  }>;
}

export interface FullStats {
  messages: MessageStats;
  sessions: SessionStats;
  responseTime: ResponseTimeStats;
  tokens: TokenStats;
  errors: ErrorStats;
}

export interface QueryLog {
  text: string;
  timestamp: string;
  responseTime: number;
  sessionId?: string;
}

// Helper: Get current date/hour keys
function getDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getHourKey(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const hour = now.getUTCHours().toString().padStart(2, '0');
  return `${date}:${hour}`; // YYYY-MM-DD:HH
}

// Helper: Generate session ID from request
function generateSessionId(req?: Request): string {
  if (!req) return 'unknown';

  // Try to get from headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Simple hash function
  const hash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  return hash(ip + userAgent);
}

/**
 * Track a new message
 */
export async function trackMessage(query: string, req?: Request): Promise<void> {
  if (!process.env.KV_REST_API_URL) {
    console.warn('KV not configured, skipping analytics');
    return;
  }

  try {
    const dateKey = getDateKey();
    const hourKey = getHourKey();
    const sessionId = generateSessionId(req);
    const timestamp = new Date().toISOString();

    // Increment counters
    await Promise.all([
      kv.incr('stats:messages:total'),
      kv.incr(`stats:messages:${dateKey}`),
      kv.incr(`stats:messages:${hourKey}`),
      kv.sadd('stats:sessions:unique', sessionId),
      kv.zadd('stats:sessions:active', { score: Date.now(), member: sessionId }),
    ]);

    // Store recent query (keep last 100)
    const queryLog: QueryLog = {
      text: query.substring(0, 200), // Limit length
      timestamp,
      sessionId,
      responseTime: 0, // Will be updated later
    };

    await kv.lpush('recent:queries', JSON.stringify(queryLog));
    await kv.ltrim('recent:queries', 0, 99); // Keep only 100

    // Set expiry on daily/hourly keys (cleanup)
    await kv.expire(`stats:messages:${dateKey}`, 60 * 60 * 24 * 90); // 90 days
    await kv.expire(`stats:messages:${hourKey}`, 60 * 60 * 24 * 7); // 7 days

  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't throw - analytics should never break the app
  }
}

/**
 * Track response time
 */
export async function trackResponseTime(timeMs: number): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;

  try {
    const stats = await kv.hgetall<ResponseTimeStats>('stats:response_times') || {
      avg: 0,
      min: 0,
      max: 0,
      count: 0,
    };

    const newCount = stats.count + 1;
    const newAvg = ((stats.avg * stats.count) + timeMs) / newCount;
    const newMin = stats.min === 0 ? timeMs : Math.min(stats.min, timeMs);
    const newMax = Math.max(stats.max, timeMs);

    await kv.hset('stats:response_times', {
      avg: Math.round(newAvg),
      min: newMin,
      max: newMax,
      count: newCount,
    });
  } catch (error) {
    console.error('Response time tracking error:', error);
  }
}

/**
 * Track token usage
 */
export async function trackTokens(inputTokens: number, outputTokens: number): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;

  try {
    // Claude 3.5 Haiku pricing (per 1M tokens)
    const INPUT_COST = 0.25; // $0.25 per 1M input tokens
    const OUTPUT_COST = 1.25; // $1.25 per 1M output tokens

    const inputCost = (inputTokens / 1_000_000) * INPUT_COST;
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST;
    const totalCost = inputCost + outputCost;

    await kv.hincrby('stats:tokens', 'input', inputTokens);
    await kv.hincrby('stats:tokens', 'output', outputTokens);
    await kv.hincrbyfloat('stats:tokens', 'cost', totalCost);
  } catch (error) {
    console.error('Token tracking error:', error);
  }
}

/**
 * Track an error
 */
export async function trackError(error: Error | string): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;

  try {
    await kv.incr('stats:errors:total');

    const errorLog = {
      message: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
    };

    await kv.lpush('recent:errors', JSON.stringify(errorLog));
    await kv.ltrim('recent:errors', 0, 49); // Keep only 50
  } catch (err) {
    console.error('Error tracking error:', err);
  }
}

/**
 * Get all stats
 */
export async function getStats(): Promise<FullStats> {
  if (!process.env.KV_REST_API_URL) {
    throw new Error('KV not configured');
  }

  try {
    const dateKey = getDateKey();
    const hourKey = getHourKey();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Fetch all stats in parallel
    const [
      totalMessages,
      todayMessages,
      hourMessages,
      totalSessions,
      activeSessions,
      responseStats,
      tokenStats,
      totalErrors,
      recentErrors,
    ] = await Promise.all([
      kv.get<number>('stats:messages:total') || 0,
      kv.get<number>(`stats:messages:${dateKey}`) || 0,
      kv.get<number>(`stats:messages:${hourKey}`) || 0,
      kv.scard('stats:sessions:unique') || 0,
      kv.zcount('stats:sessions:active', oneHourAgo, now) || 0,
      kv.hgetall<ResponseTimeStats>('stats:response_times'),
      kv.hgetall<TokenStats>('stats:tokens'),
      kv.get<number>('stats:errors:total') || 0,
      kv.lrange('recent:errors', 0, 4), // Last 5 errors
    ]);

    // Clean up old active sessions
    await kv.zremrangebyscore('stats:sessions:active', 0, oneHourAgo);

    return {
      messages: {
        total: totalMessages,
        today: todayMessages,
        thisHour: hourMessages,
      },
      sessions: {
        total: totalSessions,
        active: activeSessions,
      },
      responseTime: responseStats || {
        avg: 0,
        min: 0,
        max: 0,
        count: 0,
      },
      tokens: {
        input: tokenStats?.input || 0,
        output: tokenStats?.output || 0,
        total: (tokenStats?.input || 0) + (tokenStats?.output || 0),
        cost: tokenStats?.cost || 0,
      },
      errors: {
        total: totalErrors,
        recent: recentErrors.map((err) => JSON.parse(err as string)),
      },
    };
  } catch (error) {
    console.error('Get stats error:', error);
    throw error;
  }
}

/**
 * Get recent queries
 */
export async function getRecentQueries(limit: number = 10): Promise<QueryLog[]> {
  if (!process.env.KV_REST_API_URL) {
    throw new Error('KV not configured');
  }

  try {
    const queries = await kv.lrange('recent:queries', 0, limit - 1);
    return queries.map((q) => JSON.parse(q as string));
  } catch (error) {
    console.error('Get queries error:', error);
    return [];
  }
}

/**
 * Clear old data (for maintenance)
 */
export async function clearOldData(olderThanDays: number = 30): Promise<void> {
  if (!process.env.KV_REST_API_URL) {
    throw new Error('KV not configured');
  }

  try {
    // This is a simple implementation
    // In production, you'd want to scan and delete specific keys
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // For now, just clear recent queries and errors
    // Keep totals and recent data
    await kv.ltrim('recent:queries', 0, 49); // Keep only 50
    await kv.ltrim('recent:errors', 0, 24); // Keep only 25

    console.log(`Cleared data older than ${olderThanDays} days`);
  } catch (error) {
    console.error('Clear data error:', error);
    throw error;
  }
}

/**
 * Verify KV connection
 */
export async function verifyConnection(): Promise<boolean> {
  if (!process.env.KV_REST_API_URL) {
    return false;
  }

  try {
    await kv.set('health:check', Date.now(), { ex: 60 });
    return true;
  } catch (error) {
    console.error('KV connection error:', error);
    return false;
  }
}
