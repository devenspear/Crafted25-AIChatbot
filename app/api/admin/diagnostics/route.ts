import { kv, isKVAvailable } from '@/lib/kv-client';
import { NextRequest } from 'next/server';
import { adminRateLimit, getClientIP, checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Diagnostics endpoint to test KV connection and environment variables
 *
 * Security: Rate limited (5 req/min) + Bearer token authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResponse = await checkRateLimit(adminRateLimit, clientIP);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Security: Authentication check (environment variable only)
    const authHeader = req.headers.get('authorization');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('[Admin Diagnostics] ADMIN_PASSWORD environment variable not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      console.warn('[Admin Diagnostics] Unauthorized access attempt from IP:', clientIP);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
      },
      kv_client: {
        isAvailable: isKVAvailable,
        clientExists: kv !== null,
      },
      env_vars: {
        // Check for prefixed variables
        crafted_KV_URL: !!process.env.crafted_KV_URL,
        crafted_KV_REST_API_URL: !!process.env.crafted_KV_REST_API_URL,
        crafted_KV_REST_API_TOKEN: !!process.env.crafted_KV_REST_API_TOKEN,
        // Check for unprefixed variables
        KV_URL: !!process.env.KV_URL,
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      },
      tests: {
        connection: 'not_tested',
        write: 'not_tested',
        read: 'not_tested',
      }
    };

    // Test 1: Try to connect and write
    if (kv && isKVAvailable) {
      try {
        const testKey = 'diagnostic:test';
        const testValue = { test: true, timestamp: Date.now() };

        await kv.set(testKey, testValue);
        diagnostics.tests.write = 'success';

        // Test 2: Try to read
        const readValue = await kv.get(testKey);
        diagnostics.tests.read = readValue ? 'success' : 'failed';
        diagnostics.tests.readValue = readValue;

        // Test 3: Check if analytics keys exist
        const analyticsKeys = await kv.keys('analytics:*');
        diagnostics.analytics = {
          totalKeys: analyticsKeys.length,
          keys: analyticsKeys.slice(0, 10), // First 10 keys
        };

        // Cleanup test key
        await kv.del(testKey);

        diagnostics.tests.connection = 'success';
      } catch (error: any) {
        diagnostics.tests.connection = 'failed';
        diagnostics.tests.error = error.message;
      }
    } else {
      diagnostics.tests.connection = 'kv_not_available';
      diagnostics.tests.reason = 'KV client is null or not available';
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Diagnostics failed',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
