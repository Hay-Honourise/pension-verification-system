import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for admin dashboard
  if (request.nextUrl.pathname.startsWith('/admin-dashboard')) {
    // TODO: Implement proper JWT token verification
    // For now, allow access (you should implement proper auth)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-dashboard/:path*',
  ],
};
