'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { CrossIcon, ChevronDownIcon } from './icons';
import { Card } from './ui/card';
import { Markdown } from './markdown';
import { cn } from '@/lib/utils';

const WORLDVIEW_CONFIG = [
  {
    name: 'Survival',
    bgColor: '#F3384B',
    textColor: '#000000'
  },
  {
    name: 'Emotional',
    bgColor: '#FF8C00',
    textColor: '#000000'
  },
  {
    name: 'Social',
    bgColor: '#FCE91B',
    textColor: '#000000'
  },
  {
    name: 'Rational',
    bgColor: '#37D1AC',
    textColor: '#000000'
  },
  {
    name: 'Pluralistic',
    bgColor: '#3765D2',
    textColor: '#FFFFFF'
  },
  {
    name: 'Narrative-Integrated',
    bgColor: '#7444C7',
    textColor: '#FFFFFF'
  },
  {
    name: 'Nondual',
    bgColor: '#CDCDCD',
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

interface PerspectiveCardProps {
  worldview: typeof WORLDVIEW_CONFIG[0];
  perspective: string;
  response: string;
  index: number;
}

const PerspectiveCard = ({ worldview, perspective, response, index }: PerspectiveCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-6 last:mb-0"
    >
      <div
        className="rounded-xl backdrop-blur-sm bg-background/30 border border-border/50 overflow-hidden"
        style={{
          boxShadow: `0 4px 20px ${worldview.bgColor}15`
        }}
      >
        <div className="p-6">
          <div
            className="inline-flex px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{
              backgroundColor: worldview.bgColor,
              color: worldview.textColor
            }}
          >
            {worldview.name}
          </div>

          <div className="text-sm text-muted-foreground/80 italic leading-relaxed mb-4">
            {perspective}
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
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [messageId, setMessageId] = useState<string>('');
  const [activeSection, setActiveSection] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleShowDetails = (e: CustomEvent<{ details: any; messageId: string }>) => {
      setDetails(e.detail.details || {});
      setMessageId(e.detail.messageId);
      setIsOpen(true);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('showDetails', handleShowDetails as EventListener);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('showDetails', handleShowDetails as EventListener);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasSection = (sectionName: keyof typeof details) => {
    return details && details[sectionName] && details[sectionName].length > 0;
  };

  const hasSynthesis = () => details && details.firstPassSynthesis;
  const hasMediation = () => details && details.mediation;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 right-0 w-[600px] h-full bg-gradient-to-b from-background/95 to-background border-l border-border/50 backdrop-blur-xl z-50 shadow-2xl"
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-xl text-foreground/90">Response Details</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <CrossIcon size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {!hasSection('perspectives') && !hasSynthesis() && !hasSection('evaluations') && !hasMediation() ? (
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
                      Loading details...
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {hasSection('perspectives') && (
                      <Section title="Gathering perspectives" step={1}>
                        <div className="space-y-4">
                          {details?.perspectives.map((p: any, i: number) => (
                            <PerspectiveCard
                              key={i}
                              worldview={WORLDVIEW_CONFIG[i]}
                              perspective={p.perspective}
                              response={p.response}
                              index={i}
                            />
                          ))}
                        </div>
                      </Section>
                    )}

                    {hasSynthesis() && (
                      <Section title="Initial synthesis" step={2}>
                        <div className={cn(
                          "prose prose-sm max-w-none",
                          "text-foreground/90"
                        )}>
                          <Markdown>{details?.firstPassSynthesis}</Markdown>
                        </div>
                      </Section>
                    )}

                    {hasSection('evaluations') && (
                      <Section title="Evaluating perspectives" step={3}>
                        <div className="space-y-4">
                          {details?.evaluations.map((e: any, i: number) => (
                            <PerspectiveCard
                              key={i}
                              worldview={WORLDVIEW_CONFIG[i]}
                              perspective={e.perspective}
                              response={e.response}
                              index={i}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
