'use client';

import { motion } from 'framer-motion';
import { usePanel } from './panel-context';
import { cn } from '@/lib/utils';

interface RightPanelProps {
  children: React.ReactNode;
}

export function RightPanel({ children }: RightPanelProps) {
  const { activePanel } = usePanel();
  const isOpen = activePanel !== null;

  return (
    <motion.div
      animate={{
        width: isOpen ? 600 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
      className={cn(
        "flex-none overflow-hidden border-l border-border/50 bg-background/50 backdrop-blur-sm relative",
        !isOpen && "border-l-0 w-0"
      )}
      style={{
        width: isOpen ? 600 : 0
      }}
    >
      <div className={cn(
        "h-full transition-opacity duration-300 relative",
        isOpen ? "opacity-100 overflow" : "opacity-0"
      )}>
        {children}
      </div>
    </motion.div>
  );
}
