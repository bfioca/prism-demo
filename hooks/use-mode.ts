'use client';

import { useEffect, useState } from 'react';
import { getMode } from '@/app/(chat)/actions';

export function useMode() {
  const [mode, setMode] = useState<'prism' | 'committee' | 'chat'>('chat');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMode = async () => {
      try {
        const savedMode = await getMode();
        setMode(savedMode);
      } catch (error) {
        console.error('Error loading mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMode();
  }, []);

  return {
    mode,
    setMode,
    isLoading
  };
}
