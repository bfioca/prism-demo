'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from './markdown';
import { Button } from './ui/button';
import { CrossIcon } from './icons';
import { usePanel } from './panel-context';

export function AssumptionsPanel() {
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [messageId, setMessageId] = useState<string>('');
  const { activePanel, setActivePanel } = usePanel();

  const isOpen = activePanel === 'assumptions';

  useEffect(() => {
    const handleShowAssumptions = (e: CustomEvent<{ assumptions: string[]; messageId: string }>) => {
      console.log('AssumptionsPanel received:', {
        assumptions: e.detail.assumptions,
        messageId: e.detail.messageId
      });
      setAssumptions(e.detail.assumptions);
      setMessageId(e.detail.messageId);
      setActivePanel('assumptions');
    };

    document.addEventListener('showAssumptions', handleShowAssumptions as EventListener);
    return () => document.removeEventListener('showAssumptions', handleShowAssumptions as EventListener);
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
              <h3 className="font-semibold text-xl text-foreground/90">Key Assumptions</h3>
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
                <div className="divide-y divide-border/50">
                  {assumptions.map((assumption, index) => (
                    <div key={index} className="px-6 py-4">
                      <Markdown>{assumption}</Markdown>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
