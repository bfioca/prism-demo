import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET
  });

  // Allow public routes
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/api/auth/') ||
    request.nextUrl.pathname.match(/^\/chat\/[^/]+$/);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if authenticated user tries to access auth pages
  if (token && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Check if the path starts with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if the email is from pioneersquarelabs.com
    if (!token.email?.endsWith('@pioneersquarelabs.com')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes that need auth
    '/',
    '/chat/:path*',
    '/api/:path*',

    // Auth routes that need redirect logic
    '/login',
    '/register',

    // Admin routes that need additional checks
    '/admin/:path*',
  ],
};
