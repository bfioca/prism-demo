'use client';

import { createContext, useContext, useState } from 'react';

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

  return (
    <PanelContext.Provider value={{ activePanel, setActivePanel }}>
      {children}
    </PanelContext.Provider>
  );
}

export const usePanel = () => useContext(PanelContext);
