import { NextRequest } from 'next/server';
import { trackChatRequest, trackChatResponse, getAnalyticsEvents } from '@/lib/analytics-kv';

export const runtime = 'nodejs';

/**
 * Test endpoint to verify analytics tracking
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

    const testSessionId = `test_${Date.now()}`;

    // Test 1: Track a request
    console.log('[Test] Tracking test request...');
    await trackChatRequest(testSessionId, 'Test query for billing verification');

    // Test 2: Track a response
    console.log('[Test] Tracking test response...');
    await trackChatResponse(
      testSessionId,
      1500,
      {
        input: 5000,
        output: 2000,
      },
      'claude-3-5-haiku-20241022',
      3
    );

    // Test 3: Retrieve events
    console.log('[Test] Retrieving events...');
    const events = await getAnalyticsEvents(Date.now() - 60000, Date.now());

    return new Response(JSON.stringify({
      success: true,
      testSessionId,
      eventsRetrieved: events.length,
      events: events.slice(0, 5), // Show first 5 events
      message: 'Test tracking completed successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Test] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Test tracking failed',
      details: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
