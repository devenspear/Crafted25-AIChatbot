/**
 * Analytics Tracking System with Vercel KV (Redis) Persistent Storage
 * Tracks sessions, usage patterns, AI performance, and API metrics
 */

import { kv, isKVAvailable } from './kv-client';
import type { DeviceInfo, LocationInfo, PerformanceInfo } from './user-tracking';

export interface AnalyticsEvent {
  timestamp: number;
  sessionId: string;
  userId?: string; // Unique user ID for tracking returning users
  eventType: 'chat_request' | 'chat_response' | 'error' | 'session_start';
  userQuery?: string;
  queryCategory?: string;
  responseTime?: number;
  tokensUsed?: {
    input: number;
    output: number;
  };
  modelUsed?: string;
  errorDetails?: string;
  statusCode?: number;
  relevantChunks?: number;
  // Enhanced context
  device?: DeviceInfo;
  location?: LocationInfo;
  performance?: PerformanceInfo;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  messageCount: number;
  categories: string[];
  totalTokens: number;
}

export interface DailyMetrics {
  date: string;
  totalSessions: number;
  totalMessages: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  avgResponseTime: number;
  errorCount: number;
  categoryCounts: Record<string, number>;
}

// KV Keys
const EVENTS_KEY = 'analytics:events';
const SESSIONS_KEY = 'analytics:sessions';
const DAILY_KEY_PREFIX = 'analytics:daily:';

/**
 * Generate a unique session ID based on timestamp and random string
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Categorize user query into relevant topics
 */
export function categorizeQuery(query: string): string {
  const categories = {
    schedule: ['schedule', 'when', 'time', 'calendar', 'day', 'date'],
    events: ['event', 'activity', 'happening', 'what to do'],
    dining: ['food', 'restaurant', 'dining', 'meal', 'eat', 'drink', 'wine', 'firkin'],
    workshops: ['workshop', 'class', 'learn', 'session', 'hands-on'],
    speakers: ['speaker', 'talk', 'presentation', 'who is'],
    location: ['where', 'location', 'venue', 'place', 'find'],
    general: ['what is', 'tell me about', 'crafted', 'alys beach'],
  };

  const lowerQuery = query.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Track a chat request
 */
export async function trackChatRequest(
  sessionId: string,
  userQuery: string,
  userId?: string,
  device?: DeviceInfo,
  location?: LocationInfo,
  performance?: PerformanceInfo
): Promise<void> {
  if (!kv || !isKVAvailable) {
    console.warn('[Analytics] KV not available, skipping tracking');
    return;
  }

  try {
    const event: AnalyticsEvent = {
      timestamp: Date.now(),
      sessionId,
      userId,
      eventType: 'chat_request',
      userQuery,
      queryCategory: categorizeQuery(userQuery),
      device,
      location,
      performance,
    };

    console.log('[Analytics] Adding event to sorted set:', {
      key: EVENTS_KEY,
      score: event.timestamp,
      eventType: event.eventType
    });

    // Add event to sorted set with timestamp as score
    const zaddResult = await kv.zadd(EVENTS_KEY, { score: event.timestamp, member: JSON.stringify(event) });
    console.log('[Analytics] zadd result:', zaddResult);

    // Update session metrics
    const sessionKey = `${SESSIONS_KEY}:${sessionId}`;
    const session = await kv.get<SessionMetrics>(sessionKey);

    const updatedSession: SessionMetrics = session || {
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      categories: [],
      totalTokens: 0,
    };

    updatedSession.lastActivity = Date.now();
    updatedSession.messageCount += 1;

    if (event.queryCategory && !updatedSession.categories.includes(event.queryCategory)) {
      updatedSession.categories.push(event.queryCategory);
    }

    await kv.set(sessionKey, updatedSession);
    await kv.expire(sessionKey, 60 * 60 * 24 * 30); // 30 days TTL

    console.log('[Analytics] Chat request tracked successfully');
  } catch (error) {
    console.error('[Analytics] Error tracking chat request:', error);
    if (error instanceof Error) {
      console.error('[Analytics] Error details:', error.message, error.stack);
    }
  }
}

/**
 * Track a chat response
 */
export async function trackChatResponse(
  sessionId: string,
  responseTime: number,
  tokensUsed: { input: number; output: number },
  modelUsed: string,
  relevantChunks: number,
  userId?: string
): Promise<void> {
  if (!kv || !isKVAvailable) {
    console.warn('[Analytics] KV not available, skipping tracking');
    return;
  }

  try {
    const event: AnalyticsEvent = {
      timestamp: Date.now(),
      sessionId,
      userId,
      eventType: 'chat_response',
      responseTime,
      tokensUsed,
      modelUsed,
      relevantChunks,
      statusCode: 200,
    };

    console.log('[Analytics] Tracking chat response:', {
      sessionId,
      tokens: tokensUsed,
      responseTime,
      model: modelUsed
    });

    // Add event to sorted set
    const zaddResult = await kv.zadd(EVENTS_KEY, { score: event.timestamp, member: JSON.stringify(event) });
    console.log('[Analytics] zadd result for response:', zaddResult);

    // Update session metrics
    const sessionKey = `${SESSIONS_KEY}:${sessionId}`;
    const session = await kv.get<SessionMetrics>(sessionKey);

    if (session) {
      session.totalTokens += tokensUsed.input + tokensUsed.output;
      await kv.set(sessionKey, session);
      await kv.expire(sessionKey, 60 * 60 * 24 * 30); // 30 days TTL
      console.log('[Analytics] Session updated with token usage');
    } else {
      console.warn('[Analytics] Session not found for response tracking:', sessionId);
    }

    console.log('[Analytics] Chat response tracked successfully');
  } catch (error) {
    console.error('[Analytics] Error tracking chat response:', error);
    if (error instanceof Error) {
      console.error('[Analytics] Error details:', error.message, error.stack);
    }
  }
}

/**
 * Track an error
 */
export async function trackError(
  sessionId: string,
  errorDetails: string,
  statusCode: number
): Promise<void> {
  if (!kv || !isKVAvailable) {
    console.warn('[Analytics] KV not available, skipping tracking');
    return;
  }

  try {
    const event: AnalyticsEvent = {
      timestamp: Date.now(),
      sessionId,
      eventType: 'error',
      errorDetails,
      statusCode,
    };

    await kv.zadd(EVENTS_KEY, { score: event.timestamp, member: JSON.stringify(event) });
  } catch (error) {
    console.error('Error tracking error event:', error);
  }
}

/**
 * Get all analytics events (for admin dashboard)
 */
export async function getAnalyticsEvents(
  startDate?: number,
  endDate?: number
): Promise<AnalyticsEvent[]> {
  if (!kv || !isKVAvailable) {
    console.warn('[Analytics] KV not available, returning empty events');
    return [];
  }

  try {
    const start = startDate || 0;
    const end = endDate || Date.now();

    console.log('[Analytics] Querying events with range:', {
      start,
      end,
      startDate: new Date(start).toISOString(),
      endDate: new Date(end).toISOString()
    });

    // Get all events from sorted set and filter by timestamp
    // Note: zrange returns events in score order (oldest to newest)
    const allEvents = await kv.zrange(EVENTS_KEY, 0, -1) as unknown[];
    console.log('[Analytics] Total events in sorted set:', allEvents?.length || 0);
    console.log('[Analytics] First event type:', typeof allEvents?.[0]);

    if (!allEvents || allEvents.length === 0) {
      console.log('[Analytics] No events found in KV');
      return [];
    }

    // Parse and filter events by timestamp range
    const parsedEvents: AnalyticsEvent[] = [];

    for (const item of allEvents) {
      try {
        // Handle different possible data structures
        let event: AnalyticsEvent;

        if (typeof item === 'string') {
          event = JSON.parse(item);
        } else if (typeof item === 'object' && item !== null) {
          event = item as AnalyticsEvent;
        } else {
          console.warn('[Analytics] Unexpected item type:', typeof item);
          continue;
        }

        // Filter by timestamp range
        if (event.timestamp >= start && event.timestamp <= end) {
          parsedEvents.push(event);
        }
      } catch (err) {
        console.error('[Analytics] Failed to parse event:', err);
      }
    }

    console.log(`[Analytics] Retrieved ${parsedEvents.length} events in range [${new Date(start).toISOString()} to ${new Date(end).toISOString()}] from ${allEvents.length} total`);

    if (parsedEvents.length > 0) {
      console.log('[Analytics] Sample parsed event:', JSON.stringify(parsedEvents[0]).substring(0, 150));
    }

    return parsedEvents;
  } catch (error) {
    console.error('Error getting analytics events:', error);
    return [];
  }
}

/**
 * Get session metrics
 */
export async function getSessionMetrics(): Promise<SessionMetrics[]> {
  if (!kv || !isKVAvailable) {
    console.warn('[Analytics] KV not available, returning empty sessions');
    return [];
  }

  try {
    // Get all session keys
    const keys = await kv.keys(`${SESSIONS_KEY}:*`);
    const sessions: SessionMetrics[] = [];

    for (const key of keys) {
      const session = await kv.get<SessionMetrics>(key);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  } catch (error) {
    console.error('Error getting session metrics:', error);
    return [];
  }
}

/**
 * Calculate daily metrics
 */
export async function getDailyMetrics(days: number = 7): Promise<DailyMetrics[]> {
  try {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const dailyData: Record<string, DailyMetrics> = {};

    // Initialize days
    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * dayMs);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        totalSessions: 0,
        totalMessages: 0,
        totalTokensInput: 0,
        totalTokensOutput: 0,
        avgResponseTime: 0,
        errorCount: 0,
        categoryCounts: {},
      };
    }

    // Get events for the date range
    const startTime = now - days * dayMs;
    const events = await getAnalyticsEvents(startTime, now);

    // Aggregate events
    const sessions = new Set<string>();
    const responseTimes: number[] = [];

    events.forEach(event => {
      const date = new Date(event.timestamp);
      const dateStr = date.toISOString().split('T')[0];

      if (!dailyData[dateStr]) return;

      const day = dailyData[dateStr];

      if (event.eventType === 'chat_request') {
        sessions.add(event.sessionId);
        day.totalMessages += 1;

        if (event.queryCategory) {
          day.categoryCounts[event.queryCategory] =
            (day.categoryCounts[event.queryCategory] || 0) + 1;
        }
      }

      if (event.eventType === 'chat_response') {
        if (event.tokensUsed) {
          day.totalTokensInput += event.tokensUsed.input;
          day.totalTokensOutput += event.tokensUsed.output;
        }
        if (event.responseTime) {
          responseTimes.push(event.responseTime);
        }
      }

      if (event.eventType === 'error') {
        day.errorCount += 1;
      }
    });

    // Calculate totals
    Object.keys(dailyData).forEach(dateStr => {
      dailyData[dateStr].totalSessions = sessions.size;
      dailyData[dateStr].avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;
    });

    return Object.values(dailyData).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error calculating daily metrics:', error);
    return [];
  }
}

/**
 * Get real-time statistics
 */
export async function getRealTimeStats() {
  try {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const recentEvents = await getAnalyticsEvents(dayAgo, now);
    const hourlyEvents = recentEvents.filter(e => e.timestamp >= hourAgo);

    const activeSessions = new Set(
      hourlyEvents.map(e => e.sessionId)
    ).size;

    const allSessions = await getSessionMetrics();
    const totalSessions = allSessions.length;
    const totalMessages = recentEvents.filter(e => e.eventType === 'chat_request').length;

    const responseTimes = recentEvents
      .filter(e => e.eventType === 'chat_response' && e.responseTime)
      .map(e => e.responseTime!);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const errorCount = recentEvents.filter(e => e.eventType === 'error').length;

    const totalTokens = recentEvents
      .filter(e => e.eventType === 'chat_response' && e.tokensUsed)
      .reduce((sum, e) => sum + (e.tokensUsed!.input + e.tokensUsed!.output), 0);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    recentEvents
      .filter(e => e.eventType === 'chat_request' && e.queryCategory)
      .forEach(e => {
        const cat = e.queryCategory!;
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
      });

    return {
      activeSessions,
      totalSessions,
      totalMessages,
      avgResponseTime: Math.round(avgResponseTime),
      errorCount,
      errorRate: totalMessages > 0 ? ((errorCount / totalMessages) * 100).toFixed(2) : '0.00',
      totalTokens,
      categoryBreakdown,
      last24Hours: {
        messages: totalMessages,
        sessions: new Set(recentEvents.map(e => e.sessionId)).size,
      },
      lastHour: {
        messages: hourlyEvents.filter(e => e.eventType === 'chat_request').length,
        sessions: activeSessions,
      },
    };
  } catch (error) {
    console.error('Error getting real-time stats:', error);
    return {
      activeSessions: 0,
      totalSessions: 0,
      totalMessages: 0,
      avgResponseTime: 0,
      errorCount: 0,
      errorRate: '0.00',
      totalTokens: 0,
      categoryBreakdown: {},
      last24Hours: { messages: 0, sessions: 0 },
      lastHour: { messages: 0, sessions: 0 },
    };
  }
}

/**
 * Clean up old analytics data (keep last 30 days)
 */
export async function cleanupOldAnalytics(): Promise<void> {
  if (!kv || !isKVAvailable) {
    console.warn('[Analytics] KV not available, skipping cleanup');
    return;
  }

  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Remove old events from sorted set
    await kv.zremrangebyscore(EVENTS_KEY, 0, thirtyDaysAgo);

    // Clean up old sessions
    const keys = await kv.keys(`${SESSIONS_KEY}:*`);
    for (const key of keys) {
      const session = await kv.get<SessionMetrics>(key);
      if (session && session.lastActivity < thirtyDaysAgo) {
        await kv.del(key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old analytics:', error);
  }
}
