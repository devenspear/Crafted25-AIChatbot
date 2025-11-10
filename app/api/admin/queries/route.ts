/**
 * Admin API: Get Recent Queries
 * GET /api/admin/queries?limit=10
 *
 * Returns recent user queries
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentQueries } from '@/lib/analytics';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Check authentication
  const authHeader = request.headers.get('authorization');
  const password = authHeader?.replace('Bearer ', '');

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const queries = await getRecentQueries(limit);
    return NextResponse.json({ queries });
  } catch (error) {
    console.error('Get queries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queries' },
      { status: 500 }
    );
  }
}
