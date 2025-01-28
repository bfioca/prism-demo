import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { getUser, createUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

// Edge-compatible random string generation
const generateRandomString = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const {
  auth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;
        return users[0] as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {

      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) {
          console.error('No email provided by Google');
          return false;
        }

        try {
          const [existingUser] = await getUser(email);
          console.log('Existing user check:', existingUser ? 'found' : 'not found');

          if (!existingUser) {
            const randomPassword = generateRandomString();
            await createUser(email, randomPassword);
          }
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: any }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home after sign in
      if (url.includes('/api/auth/callback/google')) {
        return '/';
      }

      // Handle other redirects
      if (url.startsWith('/')) {
        const finalUrl = `${baseUrl}${url}`;
        return finalUrl;
      } else if (new URL(url).origin === baseUrl) {
        // If we're already logged in and trying to access auth pages, redirect to home
        if (url.includes('/login') || url.includes('/register')) {
          return '/';
        }
        return url;
      }

      return baseUrl;
    },
  },
});
