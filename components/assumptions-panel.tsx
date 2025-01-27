'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from './markdown';
import { Button } from './ui/button';
import { CrossIcon } from './icons';

export function AssumptionsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [assumptions, setAssumptions] = useState<string>('');
  const [messageId, setMessageId] = useState<string>('');

  useEffect(() => {
    const handleShowAssumptions = (e: CustomEvent<{ assumptions: string; messageId: string }>) => {
      console.log('AssumptionsPanel received:', {
        assumptions: e.detail.assumptions,
        messageId: e.detail.messageId
      });
      setAssumptions(e.detail.assumptions);
      setMessageId(e.detail.messageId);
      setIsOpen(true);
    };

    document.addEventListener('showAssumptions', handleShowAssumptions as EventListener);
    return () => document.removeEventListener('showAssumptions', handleShowAssumptions as EventListener);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 right-0 w-[400px] h-full bg-background border-l z-50 shadow-lg"
        >
          <div className="flex flex-col h-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Key Assumptions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <CrossIcon />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pl-4">
              <Markdown>
                {assumptions.split('\n').map(line =>
                  line.startsWith('-') ? '  ' + line : line
                ).join('\n')}
              </Markdown>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
