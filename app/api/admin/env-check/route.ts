/**
 * Diagnostic endpoint to check environment variables
 * GET /api/admin/diagnostics
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Check authentication
  const authHeader = request.headers.get('authorization');
  const password = authHeader?.replace('Bearer ', '');

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Gather diagnostic info
  const diagnostics = {
    timestamp: new Date().toISOString(),
    runtime: 'nodejs',
    nodeVersion: process.version,
    platform: process.platform,

    // Environment variable checks (don't expose actual values)
    environmentVariables: {
      ANTHROPIC_API_KEY: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        length: process.env.ANTHROPIC_API_KEY?.length || 0,
        startsWithCorrectPrefix: process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-') || false,
      },
      ADMIN_PASSWORD: {
        exists: !!process.env.ADMIN_PASSWORD,
        length: process.env.ADMIN_PASSWORD?.length || 0,
      },
      KV_REST_API_URL: {
        exists: !!process.env.KV_REST_API_URL,
        length: process.env.KV_REST_API_URL?.length || 0,
      },
      KV_REST_API_TOKEN: {
        exists: !!process.env.KV_REST_API_TOKEN,
        length: process.env.KV_REST_API_TOKEN?.length || 0,
      },
      crafted_KV_REST_API_URL: {
        exists: !!process.env.crafted_KV_REST_API_URL,
        length: process.env.crafted_KV_REST_API_URL?.length || 0,
      },
      crafted_KV_REST_API_TOKEN: {
        exists: !!process.env.crafted_KV_REST_API_TOKEN,
        length: process.env.crafted_KV_REST_API_TOKEN?.length || 0,
      },
      NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: {
        exists: !!process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
        value: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'not set',
      },
    },

    // All env var keys (don't show values)
    allEnvKeys: Object.keys(process.env).sort(),

    // Vercel-specific
    vercelEnv: process.env.VERCEL_ENV || 'not set',
    vercelUrl: process.env.VERCEL_URL || 'not set',
  };

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
