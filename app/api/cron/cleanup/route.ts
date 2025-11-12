import { cleanupOldAnalytics } from '@/lib/analytics-kv';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * Data Cleanup Cron Job
 *
 * Runs daily at 3 AM UTC to delete analytics data older than 30 days
 * Security: Only accessible via Vercel Cron (verified by auth header)
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 3 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Verify request is from Vercel Cron
    const authHeader = req.headers.get('authorization');

    // Vercel Cron sends: "Bearer <CRON_SECRET>"
    // Fallback for local testing: ADMIN_PASSWORD
    const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD;

    if (!cronSecret) {
      console.error('[Cron Cleanup] CRON_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron Cleanup] Unauthorized cron attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Cron Cleanup] Starting data cleanup...');
    const startTime = Date.now();

    // Run the cleanup function
    await cleanupOldAnalytics();

    const duration = Date.now() - startTime;
    console.log(`[Cron Cleanup] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Analytics cleanup completed',
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron Cleanup] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
