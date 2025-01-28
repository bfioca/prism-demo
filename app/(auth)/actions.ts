'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result?.error) {
      console.error('Sign in error:', result.error);
      return { status: 'failed' };
    }

    if (result?.url) {
      throw redirect(result.url);
    }

    throw redirect('/');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('Login error:', error);
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface GoogleLoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed';
}

export const loginWithGoogle = async (
  _: GoogleLoginActionState,
): Promise<GoogleLoginActionState> => {
  try {
    const result = await signIn('google', {
      redirect: false,
      callbackUrl: '/',
    });

    if (result?.url) {
      throw redirect(result.url);
    }

    return { status: 'success' };
  } catch (error) {
    if ((error as any)?.type === 'redirect') {
      throw error;
    }
    console.error('Google login error:', error);
    return { status: 'failed' };
  }
};

export const registerWithGoogle = async (
  _: GoogleLoginActionState,
): Promise<GoogleLoginActionState> => {
  try {
    const result = await signIn('google', {
      redirect: false,
      callbackUrl: '/',
    });
    return { status: 'success' };
  } catch (error: any) {
    // Check if this is a redirect error from NextAuth
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Extract the URL from the digest
      const redirectUrl = error.digest.split(';')[2];
      if (redirectUrl) {
        throw redirect(redirectUrl);
      }
    }
    console.error('Google register error:', error);
    return { status: 'failed' };
  }
};

export async function googleAuthenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('google', {
      callbackUrl: '/',
      redirect: true,
    });
  } catch (error: any) {
    // If it's a redirect error, we want to let it happen
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Google auth error:', error);
    if (error instanceof AuthError) {
      return 'Google sign in failed';
    }
    throw error;
  }
}
