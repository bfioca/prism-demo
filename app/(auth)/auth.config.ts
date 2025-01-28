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
      const isOnChat = nextUrl.pathname.startsWith('/');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isAuthCallback = nextUrl.pathname.startsWith('/api/auth/callback');

      // Allow OAuth callbacks
      if (isAuthCallback) {
        return true;
      }

      // Always redirect logged-in users to home if they try to access auth pages
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Allow access to auth pages for non-logged-in users
      if (isOnRegister || isOnLogin) {
        return true;
      }

      // For all other pages, require authentication
      if (!isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
