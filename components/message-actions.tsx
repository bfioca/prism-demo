import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';
import { usePanel } from './panel-context';
import { useState, useEffect , memo } from 'react';
import { useBlock } from '@/hooks/use-block';

import type { Vote } from '@/lib/db/schema';
import { getMessageIdFromAnnotations } from '@/lib/utils';
import type { Message } from '@/lib/types';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import equal from 'fast-deep-equal';

function extractPrismSections(content: string) {
  const keyAssumptionsMatch = content.match(/\d+\.\s*\*\*Key Assumptions\*\*:?\s*([\s\S]*?)(?=\s*\d+\.\s*\*\*Response\*\*)/i);
  const responseMatch = content.match(/\d+\.\s*\*\*Response\*\*:?\s*([\s\S]*?)$/i);

  // Clean up and ensure proper indentation
  const cleanAssumptions = (text?: string) => {
    if (!text) return undefined;

    // Split by bullet points and clean up each point
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.substring(1).trim()) // Remove the bullet point
      .filter(line => line.length > 0);
  };

  return {
    keyAssumptions: cleanAssumptions(keyAssumptionsMatch?.[1]),
    response: responseMatch ? responseMatch[1].trim() : undefined,
  };
}

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  isReadonly,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  isReadonly?: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { setActivePanel, activePanel } = usePanel();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [messageId, setMessageId] = useState<string | null>(null);
  const { block } = useBlock();

  useEffect(() => {
    const handlePanelChange = (e: CustomEvent<{ messageId: string; isStreaming?: boolean }>) => {
      // Don't update messageId for streaming events
      if (!e.detail.isStreaming) {
        setMessageId(e.detail.messageId);
      }
    };

    document.addEventListener('showDetails', handlePanelChange as EventListener);
    document.addEventListener('showAssumptions', handlePanelChange as EventListener);
    document.addEventListener('showBaseline', handlePanelChange as EventListener);

    return () => {
      document.removeEventListener('showDetails', handlePanelChange as EventListener);
      document.removeEventListener('showAssumptions', handlePanelChange as EventListener);
      document.removeEventListener('showBaseline', handlePanelChange as EventListener);
    };
  }, []);

  if (isLoading) return null;
  if (message.role === 'user') return null;
  if (message.toolInvocations && message.toolInvocations.length > 0)
    return null;

  const { keyAssumptions } = extractPrismSections(message.content as string);
  const isPrismResponse = message.prism_data !== undefined ||
    (message.content as string)?.includes('1. **Key Assumptions**') || // Prism responses always have this structure
    (message.content as string)?.includes('Getting responses from each perspective'); // Prism mode indicator

  // Debug logging
  console.log('MessageActions:', {
    content: message.content,
    keyAssumptions,
    isPrismResponse,
    prism_data: message.prism_data,
    hasBaselineResponse: message.prism_data?.baselineResponse ? true : false
  });

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        {!isReadonly && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-1 px-2 h-fit text-muted-foreground"
                  variant="outline"
                  onClick={async () => {
                    await copyToClipboard(message.content as string);
                    toast.success('Copied to clipboard!');
                  }}
                >
                  <CopyIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
                  disabled={vote?.isUpvoted}
                  variant="outline"
                  onClick={async () => {
                    const messageId = getMessageIdFromAnnotations(message);

                    const upvote = fetch('/api/vote', {
                      method: 'PATCH',
                      body: JSON.stringify({
                        chatId,
                        messageId,
                        type: 'up',
                      }),
                    });

                    toast.promise(upvote, {
                      loading: 'Upvoting Response...',
                      success: () => {
                        mutate<Array<Vote>>(
                          `/api/vote?chatId=${chatId}`,
                          (currentVotes) => {
                            if (!currentVotes) return [];

                            const votesWithoutCurrent = currentVotes.filter(
                              (vote) => vote.messageId !== message.id,
                            );

                            return [
                              ...votesWithoutCurrent,
                              {
                                chatId,
                                messageId: message.id,
                                isUpvoted: true,
                              },
                            ];
                          },
                          { revalidate: false },
                        );

                        return 'Upvoted Response!';
                      },
                      error: 'Failed to upvote response.',
                    });
                  }}
                >
                  <ThumbUpIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upvote Response</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
                  variant="outline"
                  disabled={vote && !vote.isUpvoted}
                  onClick={async () => {
                    const messageId = getMessageIdFromAnnotations(message);

                    const downvote = fetch('/api/vote', {
                      method: 'PATCH',
                      body: JSON.stringify({
                        chatId,
                        messageId,
                        type: 'down',
                      }),
                    });

                    toast.promise(downvote, {
                      loading: 'Downvoting Response...',
                      success: () => {
                        mutate<Array<Vote>>(
                          `/api/vote?chatId=${chatId}`,
                          (currentVotes) => {
                            if (!currentVotes) return [];

                            const votesWithoutCurrent = currentVotes.filter(
                              (vote) => vote.messageId !== message.id,
                            );

                            return [
                              ...votesWithoutCurrent,
                              {
                                chatId,
                                messageId: message.id,
                                isUpvoted: false,
                              },
                            ];
                          },
                          { revalidate: false },
                        );

                        return 'Downvoted Response!';
                      },
                      error: 'Failed to downvote response.',
                    });
                  }}
                >
                  <ThumbDownIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Downvote Response</TooltipContent>
            </Tooltip>
          </>
        )}

        {isPrismResponse && (
          <>
            {keyAssumptions && keyAssumptions.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="py-1 px-2 h-fit text-muted-foreground text-sm"
                    variant="outline"
                    onClick={() => {
                      if (keyAssumptions && keyAssumptions.length > 0) {
                        // If clicking the same message's button while panel is open, close it
                        if (message.id === messageId && activePanel === 'assumptions') {
                          setActivePanel(null);
                          return;
                        }

                        document.dispatchEvent(new CustomEvent('showAssumptions', {
                          detail: {
                            assumptions: keyAssumptions,
                            messageId: message.id
                          }
                        }));
                      }
                    }}
                  >
                    Key Assumptions
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Key Assumptions</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-1 px-2 h-fit text-muted-foreground text-sm"
                  variant="outline"
                  onClick={() => {
                    // If clicking the same message's button while panel is open, close it
                    if (message.id === messageId && activePanel === 'baseline') {
                      setActivePanel(null);
                      return;
                    }

                    // First set the panel state
                    setActivePanel('baseline');
                    // Then update the content
                    document.dispatchEvent(new CustomEvent('showBaseline', {
                      detail: {
                        baseline: message.prism_data?.baselineResponse || '',
                        messageId: message.id
                      }
                    }));
                  }}
                >
                  View Baseline
                </Button>
              </TooltipTrigger>
              <TooltipContent>Baseline Comparison</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-1 px-2 h-fit text-muted-foreground text-sm"
                  variant="outline"
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('showDetails', {
                      detail: {
                        details: message.prism_data || {},
                        messageId: message.id
                      }
                    }));
                  }}
                >
                  View Details
                </Button>
              </TooltipTrigger>
              <TooltipContent>Full Details</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.isReadonly !== nextProps.isReadonly) return false;

    return true;
  },
);
