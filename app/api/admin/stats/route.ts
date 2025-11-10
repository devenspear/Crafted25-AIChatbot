/**
 * Admin API: Get Stats
 * GET /api/admin/stats
 *
 * Returns all analytics statistics
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/analytics';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Check authentication
  const authHeader = request.headers.get('authorization');
  const password = authHeader?.replace('Bearer ', '');

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
