import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './app/(auth)/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();

  console.log('Middleware session check:', {
    path: request.nextUrl.pathname,
    hasSession: !!session,
    sessionData: session
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
  if (!session?.user) {
    console.log('No valid session found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if authenticated user tries to access auth pages
  if (session && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Check if the path starts with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Admin check - session:', session);
    // Check if user is an admin
    if (!session.user.admin) {
      console.log('Access denied - user is not admin');
      return NextResponse.redirect(new URL('/', request.url));
    }
    console.log('Access granted - user is admin');
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
