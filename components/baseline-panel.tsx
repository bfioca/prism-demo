'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { CrossIcon } from './icons';
import { cn } from '@/lib/utils';
import { usePanel } from './panel-context';
import { Markdown } from './markdown';

export function BaselinePanel() {
  const [baseline, setBaseline] = useState<string>('');
  const { activePanel, setActivePanel } = usePanel();

  const isOpen = activePanel === 'baseline';

  useEffect(() => {
    const handleShowBaseline = (e: CustomEvent<{ baseline: string }>) => {
      setBaseline(e.detail.baseline);
      setActivePanel('baseline');
    };

    document.addEventListener('showBaseline', handleShowBaseline as EventListener);

    return () => {
      document.removeEventListener('showBaseline', handleShowBaseline as EventListener);
    };
  }, [setActivePanel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-none overflow-hidden h-full"
        >
          <div className="flex flex-col h-full">
            <div className="flex-none flex justify-between items-center px-6 py-4 border-b border-border/50 bg-background/50">
              <h3 className="font-semibold text-xl text-foreground/90">Baseline Response</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanel(null)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <CrossIcon size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  {baseline ? (
                    <div className={cn(
                      "prose prose-sm max-w-none",
                      "text-foreground/90"
                    )}>
                      <Markdown>{baseline}</Markdown>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      No baseline response available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
