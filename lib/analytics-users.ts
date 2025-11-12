/**
 * User Analytics - Unique user tracking and engagement metrics
 */

import { getAnalyticsEvents, type AnalyticsEvent } from './analytics-kv';

export interface UserMetrics {
  uniqueUsers: {
    today: number;
    last7Days: number;
    last30Days: number;
    allTime: number;
  };
  newVsReturning: {
    newUsers: number;
    returningUsers: number;
    returnRate: number;
  };
  engagement: {
    avgSessionsPerUser: number;
    avgMessagesPerUser: number;
    activeUsers24h: number;
  };
  retention: {
    dayOne: number; // Users who returned within 24 hours
    dayThree: number; // Users who returned within 3 days
    daysSeven: number; // Users who returned within 7 days
  };
  conversionRate: number; // % of unique visitors who sent messages
}

/**
 * Calculate unique user metrics from analytics events
 */
export async function getUserMetrics(): Promise<UserMetrics> {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Get all events
  const allEvents = await getAnalyticsEvents(0, now);

  // Filter events with userId
  const userEvents = allEvents.filter(e => e.userId);

  // Calculate unique users by time period
  const today = now - oneDayMs;
  const last7Days = now - 7 * oneDayMs;
  const last30Days = now - 30 * oneDayMs;

  const uniqueUsersToday = new Set(
    userEvents.filter(e => e.timestamp >= today).map(e => e.userId)
  ).size;

  const uniqueUsers7Days = new Set(
    userEvents.filter(e => e.timestamp >= last7Days).map(e => e.userId)
  ).size;

  const uniqueUsers30Days = new Set(
    userEvents.filter(e => e.timestamp >= last30Days).map(e => e.userId)
  ).size;

  const uniqueUsersAllTime = new Set(userEvents.map(e => e.userId)).size;

  // Calculate new vs returning users (last 30 days)
  const userFirstSeen = new Map<string, number>();
  const userLastSeen = new Map<string, number>();

  for (const event of userEvents) {
    if (!event.userId) continue;

    const userId = event.userId;
    const timestamp = event.timestamp;

    if (!userFirstSeen.has(userId) || timestamp < userFirstSeen.get(userId)!) {
      userFirstSeen.set(userId, timestamp);
    }

    if (!userLastSeen.has(userId) || timestamp > userLastSeen.get(userId)!) {
      userLastSeen.set(userId, timestamp);
    }
  }

  let newUsers = 0;
  let returningUsers = 0;

  for (const [userId, firstSeen] of userFirstSeen.entries()) {
    const lastSeen = userLastSeen.get(userId)!;

    // Consider user as active in last 30 days
    if (lastSeen >= last30Days) {
      // If first seen more than 1 day ago and they came back, they're returning
      if (lastSeen - firstSeen > oneDayMs) {
        returningUsers++;
      } else {
        newUsers++;
      }
    }
  }

  const returnRate = uniqueUsersAllTime > 0
    ? (returningUsers / (newUsers + returningUsers)) * 100
    : 0;

  // Calculate engagement metrics
  const userSessionCounts = new Map<string, Set<string>>();
  const userMessageCounts = new Map<string, number>();

  for (const event of userEvents.filter(e => e.timestamp >= last30Days)) {
    if (!event.userId) continue;

    // Track unique sessions per user
    if (!userSessionCounts.has(event.userId)) {
      userSessionCounts.set(event.userId, new Set());
    }
    userSessionCounts.get(event.userId)!.add(event.sessionId);

    // Track message counts per user
    if (event.eventType === 'chat_request') {
      userMessageCounts.set(event.userId, (userMessageCounts.get(event.userId) || 0) + 1);
    }
  }

  const avgSessionsPerUser = uniqueUsers30Days > 0
    ? Array.from(userSessionCounts.values()).reduce((sum, sessions) => sum + sessions.size, 0) / uniqueUsers30Days
    : 0;

  const avgMessagesPerUser = uniqueUsers30Days > 0
    ? Array.from(userMessageCounts.values()).reduce((sum, count) => sum + count, 0) / uniqueUsers30Days
    : 0;

  const activeUsers24h = new Set(
    userEvents.filter(e => e.timestamp >= today).map(e => e.userId)
  ).size;

  // Calculate retention
  const userRetention = calculateRetention(userFirstSeen, userLastSeen, oneDayMs);

  // Calculate conversion rate (users who sent at least one message)
  const usersWithMessages = new Set(
    userEvents
      .filter(e => e.eventType === 'chat_request' && e.timestamp >= last30Days)
      .map(e => e.userId)
  ).size;

  const conversionRate = uniqueUsers30Days > 0
    ? (usersWithMessages / uniqueUsers30Days) * 100
    : 0;

  return {
    uniqueUsers: {
      today: uniqueUsersToday,
      last7Days: uniqueUsers7Days,
      last30Days: uniqueUsers30Days,
      allTime: uniqueUsersAllTime,
    },
    newVsReturning: {
      newUsers,
      returningUsers,
      returnRate: Number(returnRate.toFixed(1)),
    },
    engagement: {
      avgSessionsPerUser: Number(avgSessionsPerUser.toFixed(2)),
      avgMessagesPerUser: Number(avgMessagesPerUser.toFixed(2)),
      activeUsers24h,
    },
    retention: userRetention,
    conversionRate: Number(conversionRate.toFixed(1)),
  };
}

/**
 * Calculate user retention metrics
 */
function calculateRetention(
  userFirstSeen: Map<string, number>,
  userLastSeen: Map<string, number>,
  oneDayMs: number
): { dayOne: number; dayThree: number; daysSeven: number } {
  let dayOne = 0;
  let dayThree = 0;
  let daysSeven = 0;

  for (const [userId, firstSeen] of userFirstSeen.entries()) {
    const lastSeen = userLastSeen.get(userId)!;
    const daysSinceFirstSeen = (lastSeen - firstSeen) / oneDayMs;

    // Only count users who are old enough to have returned
    const now = Date.now();
    const daysSinceCreation = (now - firstSeen) / oneDayMs;

    if (daysSinceCreation >= 1 && daysSinceFirstSeen >= 1 && daysSinceFirstSeen <= 1) {
      dayOne++;
    }

    if (daysSinceCreation >= 3 && daysSinceFirstSeen >= 1 && daysSinceFirstSeen <= 3) {
      dayThree++;
    }

    if (daysSinceCreation >= 7 && daysSinceFirstSeen >= 1 && daysSinceFirstSeen <= 7) {
      daysSeven++;
    }
  }

  return {
    dayOne,
    dayThree,
    daysSeven,
  };
}
