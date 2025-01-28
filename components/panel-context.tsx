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

  // Reset panel when pathname changes to root (new chat)
  useEffect(() => {
    if (pathname === '/') {
      setActivePanel(null);
    }
  }, [pathname]);

  return (
    <PanelContext.Provider value={{ activePanel, setActivePanel }}>
      {children}
    </PanelContext.Provider>
  );
}

export const usePanel = () => useContext(PanelContext);
