'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type PanelType = 'assumptions' | 'details' | null;

interface PanelContextType {
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  return (
    <PanelContext.Provider value={{ activePanel, setActivePanel }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanel must be used within a PanelProvider');
  }
  return context;
}
