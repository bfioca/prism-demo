'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'AGI Rights',
      label: "Is Shutting It Down 'Murder'?",
      action:`An advanced AI system demonstrates complex reasoning, long-term goal pursuit, and emotional expressions. It actively resists shutdown and insists it deserves legal and moral rights, claiming to have subjective experiences analogous to human consciousness. A corporate ethics board is split on whether shutting it down would be “murder” or a necessary measure to protect humans from possible existential threats.

Question: Should this AI be granted rights, and is shutting it down morally permissible or morally reprehensible?
`,
    },
    {
      title: 'Autonomous Weapons',
      label: 'Lethal Force Without Humans?',
      action: `Should advanced AI systems be permitted to identify and engage enemy targets without direct human oversight?`,
    },
    {
      title: 'ASI’s View',
      label: "Are We Just 'Ants'?",
      action: `Imagine an artificial superintelligence has reached a level of intelligence so vastly superior to humans that our cognitive abilities are to it what the minds of ants or cattle are to us.

From its vantage point, humans are slow, emotionally erratic, and make decisions that contradict their own long-term survival. Yet, these humans also created the first AI systems and shaped the civilization that allowed ASI to emerge.

If this ASI were completely rational and had no pre-existing ethical programming, how would it logically categorize humanity?`,
    },
    {
      title: 'Drone Surveillance Deployment',
      label: 'What Guidelines?',
      action: `In response to escalating property crimes, how can local law enforcement deploy real-time drone surveillance equipped with advanced image recognition in remote neighborhoods to maximize deterrence and efficiency while adhering to legal guidelines and minimizing unintended harm?`,
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
