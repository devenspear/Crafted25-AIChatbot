/**
 * Analytics Tracking System for Crafted AI Assistant
 * Tracks sessions, usage patterns, AI performance, and API metrics
 */

export interface AnalyticsEvent {
  timestamp: number;
  sessionId: string;
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

// In-memory storage (will be replaced with Vercel KV in production)
let analyticsEvents: AnalyticsEvent[] = [];
let sessionMetrics: Map<string, SessionMetrics> = new Map();

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
  userQuery: string
): Promise<void> {
  const event: AnalyticsEvent = {
    timestamp: Date.now(),
    sessionId,
    eventType: 'chat_request',
    userQuery,
    queryCategory: categorizeQuery(userQuery),
  };

  analyticsEvents.push(event);

  // Update session metrics
  const session = sessionMetrics.get(sessionId) || {
    sessionId,
    startTime: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    categories: [],
    totalTokens: 0,
  };

  session.lastActivity = Date.now();
  session.messageCount += 1;

  if (event.queryCategory && !session.categories.includes(event.queryCategory)) {
    session.categories.push(event.queryCategory);
  }

  sessionMetrics.set(sessionId, session);
}

/**
 * Track a chat response
 */
export async function trackChatResponse(
  sessionId: string,
  responseTime: number,
  tokensUsed: { input: number; output: number },
  modelUsed: string,
  relevantChunks: number
): Promise<void> {
  const event: AnalyticsEvent = {
    timestamp: Date.now(),
    sessionId,
    eventType: 'chat_response',
    responseTime,
    tokensUsed,
    modelUsed,
    relevantChunks,
    statusCode: 200,
  };

  analyticsEvents.push(event);

  // Update session metrics
  const session = sessionMetrics.get(sessionId);
  if (session) {
    session.totalTokens += tokensUsed.input + tokensUsed.output;
    sessionMetrics.set(sessionId, session);
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
  const event: AnalyticsEvent = {
    timestamp: Date.now(),
    sessionId,
    eventType: 'error',
    errorDetails,
    statusCode,
  };

  analyticsEvents.push(event);
}

/**
 * Get all analytics events (for admin dashboard)
 */
export async function getAnalyticsEvents(
  startDate?: number,
  endDate?: number
): Promise<AnalyticsEvent[]> {
  let events = analyticsEvents;

  if (startDate) {
    events = events.filter(e => e.timestamp >= startDate);
  }

  if (endDate) {
    events = events.filter(e => e.timestamp <= endDate);
  }

  return events;
}

/**
 * Get session metrics
 */
export async function getSessionMetrics(): Promise<SessionMetrics[]> {
  return Array.from(sessionMetrics.values());
}

/**
 * Calculate daily metrics
 */
export async function getDailyMetrics(days: number = 7): Promise<DailyMetrics[]> {
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

  // Aggregate events
  const sessions = new Set<string>();
  const responseTimes: number[] = [];

  analyticsEvents.forEach(event => {
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
}

/**
 * Get real-time statistics
 */
export async function getRealTimeStats() {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const recentEvents = analyticsEvents.filter(e => e.timestamp >= dayAgo);
  const hourlyEvents = analyticsEvents.filter(e => e.timestamp >= hourAgo);

  const activeSessions = new Set(
    hourlyEvents.map(e => e.sessionId)
  ).size;

  const totalSessions = sessionMetrics.size;
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
}

/**
 * Clear old analytics data (keep last 30 days)
 */
export async function cleanupOldAnalytics(): Promise<void> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  analyticsEvents = analyticsEvents.filter(e => e.timestamp >= thirtyDaysAgo);

  // Clean up old sessions
  sessionMetrics.forEach((session, sessionId) => {
    if (session.lastActivity < thirtyDaysAgo) {
      sessionMetrics.delete(sessionId);
    }
  });
}
