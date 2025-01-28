'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type PanelType = 'assumptions' | 'details' | 'baseline' | null;

interface PanelContextType {
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
}

const PanelContext = createContext<PanelContextType>({
  activePanel: null,
  setActivePanel: () => {},
});

export function PanelProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const pathname = usePathname();

  // Wrap setActivePanel to add logging
  const setPanelWithLogging = (panel: PanelType) => {
    console.log('=== Panel State Change ===');
    console.log('Previous panel:', activePanel);
    console.log('New panel:', panel);
    console.log('Called from:', new Error().stack);
    console.log('=========================');
    setActivePanel(panel);
  };

  // Reset panel when pathname changes to root (new chat)
  useEffect(() => {
    if (pathname === '/') {
      console.log('=== Panel Reset (pathname change) ===');
      console.log('Previous panel:', activePanel);
      console.log('New pathname:', pathname);
      console.log('=========================');
      setActivePanel(null);
    }
  }, [pathname, activePanel]);

  return (
    <PanelContext.Provider value={{ activePanel, setActivePanel: setPanelWithLogging }}>
      {children}
    </PanelContext.Provider>
  );
}

export const usePanel = () => useContext(PanelContext);
