'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

interface ProvidersProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export function Providers({ children, ...themeProps }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
    </SessionProvider>
  );
}
