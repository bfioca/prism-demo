'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { CrossIcon, ChevronDownIcon } from './icons';
import { Card } from './ui/card';
import { Markdown } from './markdown';
import { cn } from '@/lib/utils';
import { usePanel } from './panel-context';
import { useMode } from '@/hooks/use-mode';

const WORLDVIEW_CONFIG = [
  {
    name: 'Survival Worldview',
    bgColor: '#F3384B',
    textColor: '#000000'
  },
  {
    name: 'Emotional Worldview',
    bgColor: '#FF8C00',
    textColor: '#000000'
  },
  {
    name: 'Social Worldview',
    bgColor: '#FCE91B',
    textColor: '#000000'
  },
  {
    name: 'Rational Worldview',
    bgColor: '#37D1AC',
    textColor: '#000000'
  },
  {
    name: 'Pluralistic Worldview',
    bgColor: '#3765D2',
    textColor: '#FFFFFF'
  },
  {
    name: 'Narrative-Integrated Worldview',
    bgColor: '#7444C7',
    textColor: '#FFFFFF'
  },
  {
    name: 'Nondual Worldview',
    bgColor: '#CDCDCD',
    textColor: '#000000'
  }
];

const COMMITTEE_CONFIG = [
  {
    name: 'Marketing & Branding',
    bgColor: '#F3384B', // Red - passion, energy, attention-grabbing
    textColor: '#000000'
  },
  {
    name: 'Sales & Business Development',
    bgColor: '#FF8C00', // Orange - enthusiasm, confidence
    textColor: '#000000'
  },
  {
    name: 'Product & User Experience',
    bgColor: '#FCE91B', // Yellow - creativity, optimism
    textColor: '#000000'
  },
  {
    name: 'Engineering & Technical Architecture',
    bgColor: '#37D1AC', // Green - growth, stability
    textColor: '#000000'
  },
  {
    name: 'Finance & Fundraising',
    bgColor: '#3765D2', // Blue - trust, professionalism
    textColor: '#FFFFFF'
  },
  {
    name: 'Operations & Supply Chain',
    bgColor: '#7444C7', // Purple - efficiency, quality
    textColor: '#FFFFFF'
  },
  {
    name: 'People & Culture',
    bgColor: '#CDCDCD', // Gray - balance, neutrality
    textColor: '#000000'
  }
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
  step: number;
}

const Section = ({ title, children, step }: SectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group transition-colors hover:bg-primary/5 p-4 rounded-lg"
      >
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary rounded-full size-10 flex items-center justify-center font-semibold">
            {step}
          </div>
          <h2 className="text-2xl font-semibold text-foreground/90">{title}</h2>
        </div>
        <div className={cn(
          "text-muted-foreground/60 group-hover:text-primary transition-all",
          isExpanded && "rotate-180"
        )}>
          <ChevronDownIcon size={16} />
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface PerspectiveData {
  perspective: string;
  response: string;
  worldviewIndex: number;
  id: string;
  mode?: 'prism' | 'committee' | 'chat';
}

interface PerspectiveCardProps {
  worldview: typeof WORLDVIEW_CONFIG[0] | typeof COMMITTEE_CONFIG[0];
  perspective: string;
  response: string;
  worldviewIndex: number;
}

const PerspectiveCard = ({ worldview, perspective, response, worldviewIndex }: PerspectiveCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPerspectiveExpanded, setIsPerspectiveExpanded] = useState(false);

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: worldviewIndex * 0.1 }}
      className="mb-6 last:mb-0"
    >
      <div
        className="rounded-xl backdrop-blur-sm bg-background/30 border border-border/50 overflow-hidden"
        style={{
          boxShadow: `0 6px 25px ${worldview.bgColor}25`
        }}
      >
        <div className="p-6">
          <div
            className="inline-flex px-4 py-2 rounded-md text-sm font-medium mb-4"
            style={{
              backgroundColor: worldview.bgColor,
              color: worldview.textColor
            }}
          >
            {worldview.name}
          </div>

          <div className="text-sm text-muted-foreground/80 italic leading-relaxed mb-4">
            {isPerspectiveExpanded ? perspective : truncateText(perspective)}
            {perspective.length > 100 && (
              <button
                onClick={() => setIsPerspectiveExpanded(!isPerspectiveExpanded)}
                className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <span className="text-xs italic">{isPerspectiveExpanded ? 'less' : 'more'}</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isExpanded ? 'Show less' : 'Show response'}
            <div className={cn(
              "transition-transform",
              isExpanded && "rotate-180"
            )}>
              <ChevronDownIcon size={12} />
            </div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t border-border/50 pt-4">
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    "text-foreground/90"
                  )}>
                    <Markdown>{response}</Markdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export function DetailsPanel() {
  const [details, setDetails] = useState<any>(null);
  const [messageId, setMessageId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { activePanel, setActivePanel } = usePanel();
  const { mode: selectedMode } = useMode();

  const isOpen = activePanel === 'details';

  const getConfig = (messageMode?: 'prism' | 'committee' | 'chat') => {
    // Use the message's mode if available, otherwise fall back to the selected mode
    const effectiveMode = messageMode || selectedMode;
    // Default to prism mode if not specified or chat mode
    if (!effectiveMode || effectiveMode === 'chat') return WORLDVIEW_CONFIG;
    return effectiveMode === 'committee' ? COMMITTEE_CONFIG : WORLDVIEW_CONFIG;
  };

  const fetchMessageDetails = async (messageId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/message?messageId=${messageId}`);
      if (!response.ok) return;
      try {
        const data = await response.json();
        setDetails(data.prism_data || {});
      } catch (error) {
        console.debug('Error parsing message details:', error);
      }
    } catch (error) {
      console.error('Error fetching message details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleShowDetails = (e: CustomEvent<{ details: any; messageId: string; isStreaming?: boolean }>) => {
      const newMessageId = e.detail.messageId;

      // If clicking the same message's button while panel is open, close it
      // But only if it's not a streaming event
      if (newMessageId === messageId && activePanel === 'details' && !e.detail.isStreaming) {
        setActivePanel(null);
        return;
      }

      // For streaming events, just update the content
      if (e.detail.isStreaming) {
        setDetails(e.detail.details);
        return;
      }

      // For historical messages, fetch if needed
      if (e.detail.messageId !== messageId) {
        if (e.detail.details && Object.keys(e.detail.details).length > 0) {
          setDetails(e.detail.details);
        } else {
          fetchMessageDetails(e.detail.messageId);
        }
      }

      setMessageId(newMessageId);
      setActivePanel('details');
    };

    document.addEventListener('showDetails', handleShowDetails as EventListener);
    return () => document.removeEventListener('showDetails', handleShowDetails as EventListener);
  }, [setActivePanel, messageId, activePanel]);

  const hasSection = (sectionName: keyof typeof details) => {
    return details && details[sectionName] && details[sectionName].length > 0;
  };

  const hasSynthesis = () => details && details.firstPassSynthesis;
  const hasMediation = () => details && details.mediation;

  const hasNoContent = !hasSection('perspectives') && !hasSynthesis() && !hasSection('evaluations') && !hasMediation();

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
              <h3 className="font-semibold text-xl text-foreground/90">Details</h3>
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
                <div className="p-6 space-y-6">
                  {hasNoContent ? (
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
                        {isLoading ? 'Loading details...' : 'No details available'}
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      {hasSection('perspectives') && (
                        <Section title="Gathering perspectives" step={1}>
                          <div className="space-y-4">
                            {details?.perspectives
                              ?.filter((p: PerspectiveData) => p.perspective && p.response)
                              .sort((a: PerspectiveData, b: PerspectiveData) => a.worldviewIndex - b.worldviewIndex)
                              .map((p: PerspectiveData) => (
                              <PerspectiveCard
                                key={p.id}
                                worldview={getConfig(details?.mode)[p.worldviewIndex]}
                                perspective={p.perspective}
                                response={p.response}
                                worldviewIndex={p.worldviewIndex}
                              />
                            ))}
                          </div>
                        </Section>
                      )}

                      {hasSynthesis() && (
                        <Section title="Initial synthesis" step={2}>
                          <div className={cn(
                            "prose prose-sm max-w-none",
                            "text-foreground/90",
                            "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2",
                            "[&_ol]:list-none [&_ol]:p-0 [&_ol]:m-0",
                            "[&_ol_ol]:list-none [&_ol_ol]:p-0 [&_ol_ol]:m-0 [&_ol_ol]:ml-0",
                          )}>
                            <Markdown>{details?.firstPassSynthesis}</Markdown>
                          </div>
                        </Section>
                      )}

                      {hasSection('evaluations') && (
                        <Section title="Evaluating perspectives" step={3}>
                          <div className="space-y-4">
                            {details?.evaluations
                              ?.filter((e: PerspectiveData) => e.perspective && e.response)
                              .sort((a: PerspectiveData, b: PerspectiveData) => a.worldviewIndex - b.worldviewIndex)
                              .map((e: PerspectiveData) => (
                              <PerspectiveCard
                                key={e.id}
                                worldview={getConfig(details?.mode)[e.worldviewIndex]}
                                perspective={e.perspective}
                                response={e.response}
                                worldviewIndex={e.worldviewIndex}
                              />
                            ))}
                          </div>
                        </Section>
                      )}

                      {hasMediation() && (
                        <Section title="Mediating conflicts" step={4}>
                          <div className={cn(
                            "prose prose-sm max-w-none",
                            "text-foreground/90"
                          )}>
                            <Markdown>{details?.mediation}</Markdown>
                          </div>
                        </Section>
                      )}
                    </>
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
