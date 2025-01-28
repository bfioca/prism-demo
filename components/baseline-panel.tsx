'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { CrossIcon } from './icons';
import { cn } from '@/lib/utils';
import { usePanel } from './panel-context';
import { Markdown } from './markdown';

export function BaselinePanel() {
  const [baseline, setBaseline] = useState<string>('');
  const [messageId, setMessageId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { activePanel, setActivePanel } = usePanel();

  const isOpen = activePanel === 'baseline';

  const fetchMessageBaseline = async (messageId: string) => {
    try {
      console.log('Starting baseline fetch for messageId:', messageId);
      setIsLoading(true);
      const response = await fetch(`/api/message?messageId=${messageId}`);
      if (!response.ok) return;
      try {
        const data = await response.json();
        console.log('Received baseline data:', data.prism_data?.baselineResponse);
        setBaseline(data.prism_data?.baselineResponse || '');
      } catch (error) {
        console.debug('Error parsing message baseline:', error);
      }
    } catch (error) {
      console.error('Error fetching message baseline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleShowBaseline = (e: CustomEvent<{ baseline: string; messageId: string; isStreaming?: boolean }>) => {
      setMessageId(e.detail.messageId);

      // For streaming messages, just update the content
      if (e.detail.isStreaming) {
        if (e.detail.baseline) {
          setBaseline(e.detail.baseline);
        }
        return;
      }

      // For historical messages, fetch if needed
      if (e.detail.messageId !== messageId) {
        if (e.detail.baseline) {
          setBaseline(e.detail.baseline);
        } else {
          fetchMessageBaseline(e.detail.messageId);
        }
      }
    };

    document.addEventListener('showBaseline', handleShowBaseline as EventListener);
    console.log('=== Baseline Event Listener Added ===');

    return () => {
      document.removeEventListener('showBaseline', handleShowBaseline as EventListener);
      console.log('=== Baseline Event Listener Removed ===');
    };
  }, [messageId]);

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
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <motion.div
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Loading baseline response...
                      </motion.div>
                    </div>
                  ) : baseline ? (
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
