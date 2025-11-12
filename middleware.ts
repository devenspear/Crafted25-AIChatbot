import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Redirect craftedai.deven.network to craftedai.web0101.com
  if (hostname === 'craftedai.deven.network') {
    const url = request.nextUrl.clone();
    url.host = 'craftedai.web0101.com';
    url.protocol = 'https:';

    return NextResponse.redirect(url, {
      status: 302, // Temporary redirect
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  return NextResponse.next();
}

// Run middleware on all paths
export const config = {
  matcher: '/:path*',
};
