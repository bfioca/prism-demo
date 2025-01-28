import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
    verifyRequest: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthCallback = nextUrl.pathname.startsWith('/api/auth/callback');
      const isPublicRoute =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register') ||
        nextUrl.pathname.match(/^\/chat\/[^/]+$/); // Matches /chat/{id}

      console.log('Auth check:', {
        path: nextUrl.pathname,
        isLoggedIn,
        isAuthCallback,
        isPublicRoute,
      });

      // Allow OAuth callbacks
      if (isAuthCallback) {
        return true;
      }

      // Always redirect logged-in users to home if they try to access auth pages
      if (isLoggedIn && (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register'))) {
        console.log('Redirecting logged-in user from auth page to home');
        return Response.redirect(new URL('/', nextUrl));
      }

      // Allow access to public routes
      if (isPublicRoute) {
        console.log('Allowing access to public route:', nextUrl.pathname);
        return true;
      }

      // For all other pages, require authentication
      if (!isLoggedIn) {
        console.log('Redirecting unauthenticated user to login');
        return Response.redirect(new URL('/login', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
