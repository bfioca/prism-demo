'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { CrossIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Markdown } from './markdown';
import { cn } from '@/lib/utils';

export function DetailsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [messageId, setMessageId] = useState<string>('');

  useEffect(() => {
    const handleShowDetails = (e: CustomEvent<{ details: any; messageId: string }>) => {
      setDetails(e.detail.details);
      setMessageId(e.detail.messageId);
      setIsOpen(true);
    };

    document.addEventListener('showDetails', handleShowDetails as EventListener);
    return () => document.removeEventListener('showDetails', handleShowDetails as EventListener);
  }, []);

  const renderStepLabel = (step: number, label: string) => (
    <div className="flex items-center gap-2 mb-4 text-2xl">
      <div className="bg-primary/10 text-primary rounded-full size-7 flex items-center justify-center">
        {step}
      </div>
      <div>{label}</div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 right-0 w-[500px] h-full bg-background border-l z-50 shadow-lg"
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-muted/40">
              <h3 className="font-semibold text-lg p-4">Response Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <CrossIcon />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-10">
                {/* Perspectives Section */}
                <Card className="border-none shadow-none bg-muted/40">
                  <CardHeader className="pb-0">
                    {renderStepLabel(1, "Gathering perspectives")}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y">
                      {details?.perspectives.map((p: any, i: number) => (
                        <div key={i} className="space-y-3 py-8 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary px-0 py-1 rounded text-sm font-medium">
                              Worldview {i + 1}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground/80 italic leading-relaxed">{p.perspective.split('\n')[0]}</div>
                          <div className={cn(
                            "text-sm pl-4 border-l-2 border-primary/20",
                            "prose prose-sm max-w-none",
                            "text-foreground/90"
                          )}>
                            <Markdown>{p.response}</Markdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* First Pass Synthesis */}
                <Card className="border-none shadow-none bg-muted/40">
                  <CardHeader className="pb-2">
                    {renderStepLabel(2, "Initial synthesis")}
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-sm pl-4 border-l-2 border-primary/20",
                      "prose prose-sm max-w-none",
                      "text-foreground/90"
                    )}>
                      <Markdown>{details?.firstPassSynthesis}</Markdown>
                    </div>
                  </CardContent>
                </Card>

                {/* Evaluations */}
                <Card className="border-none shadow-none bg-muted/40">
                  <CardHeader className="pb-2">
                    {renderStepLabel(3, "Evaluating perspectives")}
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="divide-y">
                      {details?.evaluations.map((e: any, i: number) => (
                        <div key={i} className="space-y-3 py-8 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary px-0 py-1 rounded text-sm font-medium">
                              Worldview {i + 1}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground/80 italic leading-relaxed">{e.perspective.split('\n')[0]}</div>
                          <div className={cn(
                            "text-sm pl-4 border-l-2 border-primary/20",
                            "prose prose-sm max-w-none",
                            "text-foreground/90"
                          )}>
                            <Markdown>{e.response}</Markdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mediation */}
                <Card className="border-none shadow-none bg-muted/40">
                  <CardHeader className="pb-2">
                    {renderStepLabel(4, "Mediating conflicts")}
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-sm pl-4 border-l-2 border-primary/20",
                      "prose prose-sm max-w-none",
                      "text-foreground/90"
                    )}>
                      <Markdown>{details?.mediation}</Markdown>
                    </div>
                  </CardContent>
                </Card>


              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
