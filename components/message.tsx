'use client';

import type { ChatRequestOptions } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useMemo, useState, useEffect } from 'react';

import type { Vote } from '@/lib/db/schema';
import type { Message } from '@/lib/types';

import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';

interface ExtendedMessage extends Message {
  keyAssumptions?: string;
}

function extractPrismSections(content: string) {
  const keyAssumptionsMatch = content.match(/\*\*Key Assumptions\*\*:?([\s\S]*?)(?=\*\*Response\*\*|$)/i);
  const responseMatch = content.match(/\*\*Response\*\*:?([\s\S]*?)$/i);

  return {
    keyAssumptions: keyAssumptionsMatch ? keyAssumptionsMatch[1].trim() : undefined,
    response: responseMatch ? responseMatch[1].trim() : undefined,
  };
}

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: ExtendedMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Add debug logging
  useEffect(() => {
    console.log('[Message Debug]', {
      id: message.id,
      role: message.role,
      content: message.content,
      toolInvocations: message.toolInvocations,
      keyAssumptions: message.keyAssumptions,
      mode,
      isLoading,
      isReadonly
    });
  }, [message, mode, isLoading, isReadonly]);

  const { content: displayContent, isComplete } = useMemo(() => {
    if (!message.content) {
      return { content: '', isComplete: true };
    }

    if (message.role === 'assistant') {
      const content = message.content as string;

      // Check if this is a PRISM response (has or will have Key Assumptions and Response sections)
      const isPrismResponse = content.includes('**Key Assumptions**') || content.includes('**Response**');

      if (isPrismResponse) {
        const { keyAssumptions, response } = extractPrismSections(content);
        const isComplete = keyAssumptions && response;

        if (!isComplete) {
          return {
            isComplete: false,
            content: '',
          };
        }

        return {
          isComplete: true,
          content: <Markdown>{response}</Markdown>,
        };
      }

      // For non-PRISM responses, show the full content
      return {
        content: <Markdown>{content}</Markdown>,
        isComplete: true
      };
    }

    // For user messages, just show the content as is
    return {
      content: <Markdown>{message.content}</Markdown>,
      isComplete: true
    };
  }, [message]);

  return (
    <AnimatePresence>
      <motion.div
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full">
            {message.experimental_attachments && (
              <div className="flex flex-row justify-end gap-2">
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.role === 'assistant' && !isComplete ? (
              <div className="flex flex-row gap-2 items-start">
                <div className={cn('flex flex-col gap-4')}>
                  <div className="text-muted-foreground">
                    <motion.span
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      Thinking...
                    </motion.span>
                  </div>
                  {/* Hidden div to store streaming content */}
                  <div className="hidden">{message.content}</div>
                </div>
              </div>
            ) : message.content && mode === 'view' && (
              <div className="flex flex-row gap-2 items-start">
                {message.role === 'user' && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div
                  className={cn('flex flex-col gap-4', {
                    'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                      message.role === 'user',
                  })}
                >
                  {displayContent}
                </div>
              </div>
            )}

            {message.content && mode === 'edit' && (
              <MessageEditor
                message={message}
                setMessages={setMessages}
                setMode={setMode}
                reload={reload}
              />
            )}

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-4">
                {message.toolInvocations.map((toolInvocation) => {
                  const { toolName, toolCallId, state, args } = toolInvocation;

                  if (state === 'result') {
                    const { result } = toolInvocation;

                    return (
                      <div key={toolCallId}>
                        {toolName === 'getWeather' ? (
                          <Weather weatherAtLocation={result} />
                        ) : toolName === 'createDocument' ? (
                          <DocumentPreview
                            isReadonly={isReadonly}
                            result={result}
                          />
                        ) : toolName === 'updateDocument' ? (
                          <DocumentToolResult
                            type="update"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : toolName === 'requestSuggestions' ? (
                          <DocumentToolResult
                            type="request-suggestions"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : (
                          <pre>{JSON.stringify(result, null, 2)}</pre>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            <MessageActions
              key={`action-${message.id}`}
              chatId={chatId}
              message={message}
              vote={vote}
              isLoading={isLoading}
              isReadonly={isReadonly}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const PreviewMessage = memo(PurePreviewMessage, (prev, next) => {
  const isEqual = equal(prev, next);
  return isEqual;
});

export const ThinkingMessage = ({ message = '' }: { message?: string }) => {
  const role = 'assistant';

  if (!message || !message.trim()) return null;

  // Split into characters but preserve spaces by replacing them with a special character
  const characters = message.split('').map((char, i) => ({
    char,
    isSpace: char === ' ',
    id: `${char}-${i}`
  }));

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      data-role={role}
    >
      <div className="flex gap-4 w-full">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <motion.div
            className="translate-y-px"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon size={14} />
          </motion.div>
        </div>

        <div className="flex flex-col gap-2 w-full justify-center min-h-[32px]">
          <div className="flex flex-wrap text-foreground/90">
            {characters.map(({ char, isSpace, id }, i) => (
              <motion.span
                key={id}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isSpace ? 1 : [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: isSpace ? 0 : Infinity,
                  delay: i * 0.02,
                  ease: "easeInOut"
                }}
                className={cn(
                  "relative",
                  isSpace && "mr-[0.15em]",
                  !isSpace && "font-medium"
                )}
              >
                {isSpace ? '\u00A0' : char}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export function MessageContent({ message, isComplete }: { message: Message; isComplete?: boolean }) {
  const content = message.content;
  const isPrismResponse = content.includes('Key Assumptions:') || content.includes('Response:');

  if (isPrismResponse) {
    const { keyAssumptions, response } = extractPrismSections(content);
    const isComplete = keyAssumptions && response;

    if (!isComplete) {
      return {
        isComplete: false,
        content: '',
      };
    }

    return {
      isComplete: true,
      content: <Markdown>{response}</Markdown>,
    };
  }

  return {
    isComplete: true,
    content: <Markdown>{content}</Markdown>,
  };
}
