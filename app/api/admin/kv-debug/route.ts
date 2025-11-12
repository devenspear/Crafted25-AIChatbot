import { NextRequest } from 'next/server';
import { kv, isKVAvailable } from '@/lib/kv-client';

export const runtime = 'nodejs';

/**
 * Debug endpoint to test KV operations directly
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

    if (!kv || !isKVAvailable) {
      return new Response(JSON.stringify({ error: 'KV not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const testKey = 'analytics:events';
    const testEvent = JSON.stringify({
      timestamp: Date.now(),
      sessionId: 'debug_test',
      eventType: 'test',
      test: true,
    });

    // Test 1: Write to sorted set
    console.log('[KV Debug] Writing test event...');
    const zaddResult = await kv.zadd(testKey, {
      score: Date.now(),
      member: testEvent,
    });
    console.log('[KV Debug] zadd result:', zaddResult);

    // Test 2: Count items
    const count = await kv.zcard(testKey);
    console.log('[KV Debug] zcard count:', count);

    // Test 3: Get all items
    const allItems = await kv.zrange(testKey, 0, -1);
    console.log('[KV Debug] zrange all items:', allItems?.length);

    // Test 4: Get with scores
    const itemsWithScores = await kv.zrange(testKey, 0, -1, { withScores: true });
    console.log('[KV Debug] zrange with scores:', itemsWithScores);

    // Test 5: Get first few items
    const firstItems = await kv.zrange<string[]>(testKey, 0, 4);
    console.log('[KV Debug] First 5 items:', firstItems);

    return new Response(JSON.stringify({
      success: true,
      kv_available: isKVAvailable,
      tests: {
        zadd_result: zaddResult,
        zcard_count: count,
        zrange_all_length: allItems?.length || 0,
        zrange_with_scores: itemsWithScores,
        first_items: firstItems,
        first_items_parsed: firstItems?.map(item => {
          try {
            const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
            return JSON.parse(itemStr);
          } catch {
            return {
              error: 'parse_failed',
              type: typeof item,
              raw: typeof item === 'string' ? item.substring(0, 100) : String(item).substring(0, 100)
            };
          }
        }),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[KV Debug] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'KV debug failed',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
