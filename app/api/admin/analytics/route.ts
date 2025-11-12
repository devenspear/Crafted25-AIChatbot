import {
  getRealTimeStats,
  getDailyMetrics,
  getAnalyticsEvents,
  getSessionMetrics,
} from '@/lib/analytics-kv';
import { getBillingMetrics, getCostEfficiencyMetrics } from '@/lib/analytics-billing';
import { getUserMetrics } from '@/lib/analytics-users';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * Admin Analytics API Endpoint
 * Returns comprehensive analytics data for the admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    // Simple authentication check
    const authHeader = req.headers.get('authorization');
    const adminPassword = process.env.ADMIN_PASSWORD || 'ADMINp@ss2025';

    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'realtime';
    const days = parseInt(searchParams.get('days') || '7', 10);
    const monthlyBudget = searchParams.get('budget') ? parseFloat(searchParams.get('budget')!) : undefined;

    let data: any;

    switch (type) {
      case 'realtime':
        data = await getRealTimeStats();
        break;

      case 'daily':
        data = await getDailyMetrics(days);
        break;

      case 'events':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        data = await getAnalyticsEvents(
          startDate ? parseInt(startDate, 10) : undefined,
          endDate ? parseInt(endDate, 10) : undefined
        );
        break;

      case 'sessions':
        data = await getSessionMetrics();
        break;

      case 'billing':
        data = await getBillingMetrics(monthlyBudget);
        break;

      case 'efficiency':
        data = await getCostEfficiencyMetrics(days);
        break;

      case 'users':
        data = await getUserMetrics();
        break;

      case 'all':
        data = {
          realtime: await getRealTimeStats(),
          daily: await getDailyMetrics(days),
          sessions: await getSessionMetrics(),
          billing: await getBillingMetrics(monthlyBudget),
          users: await getUserMetrics(),
        };
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid type parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Failed to fetch analytics',
      details: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
