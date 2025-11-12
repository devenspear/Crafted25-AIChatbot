import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')

  // Redirect from old domain to new domain
  if (host === 'craftedai.deven.network') {
    const url = request.nextUrl.clone()
    url.host = 'craftedai.web0101.com'
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
