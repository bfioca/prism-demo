import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { getUser, createUser } from '@/lib/db/queries';
import { User as DBUser } from '@/lib/db/schema';

import { authConfig } from './auth.config';

declare module 'next-auth' {
  interface User {
    admin?: boolean;
  }
  interface Session {
    user: User & {
      id: string;
      admin?: boolean;
    };
  }
  interface JWT {
    id: string;
    admin?: boolean;
  }
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
        const user = users[0];
        return {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0], // Add a default name
          admin: user.admin,
        };
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
            const newUser = await createUser(email, randomPassword);
            user.id = newUser.id;
            user.admin = newUser.admin;
          } else {
            user.id = existingUser.id;
            user.admin = existingUser.admin;
          }
          console.log('Updated user object:', user);
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
        console.log('User in jwt callback:', user);
        // Preserve existing token data and add/update user fields
        return {
          ...token,
          id: user.id,
          admin: user.admin,
        };
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) {
      if (token) {
        console.log('Token in session callback:', token);
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            admin: token.admin,
          },
        };
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
