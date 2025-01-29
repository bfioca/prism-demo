import type { Message } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';
import { PreviewMessage, ThinkingMessage } from './message';
import { useEffect, useRef, useState } from 'react';
import { useScrollToBottom } from './use-scroll-to-bottom';

type DataStreamDelta = {
  type: 'thinking' | 'details' | string;
  content: string;
};

export function Messages({
  chatId,
  messages,
  votes,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  isBlockVisible,
  dataStream,
}: {
  chatId: string;
  messages: Message[];
  votes: Vote[] | undefined;
  isLoading: boolean;
  setMessages: (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  reload: () => Promise<string | null | undefined>;
  isReadonly: boolean;
  isBlockVisible: boolean;
  dataStream?: any[];
}) {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [thinkingMessage, setThinkingMessage] = useState<string>('');
  const lastProcessedIndex = useRef(-1);
  const processedDetails = useRef(new Set<string>());

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'thinking') {
        setThinkingMessage(delta.content);
      } else if (delta.type === 'details') {
        const details = JSON.parse(delta.content);

        // Reset processed details if this is the start of a new message (first perspective)
        if (details.perspectives?.length === 1 && !details.baselineResponse) {
          processedDetails.current.clear();
          // Also set the active panel to 'details' when a new message starts
          document.dispatchEvent(new CustomEvent('setPanel', { detail: { panel: 'details' } }));
        }

        // Create a key that reflects the current step
        const detailsKey = [
          details.perspectives?.length && `perspectives:${details.perspectives.length}`,
          details.baselineResponse && 'baseline',
          details.firstPassSynthesis && 'synthesis',
          details.evaluations?.length && `evaluations:${details.evaluations.length}`,
          details.mediation && 'mediation'
        ].filter(Boolean).join('-');

        if (processedDetails.current.has(detailsKey)) {
          return;
        }
        processedDetails.current.add(detailsKey);

        // Update the last message with the new prism_data
        setMessages((currentMessages) => {
          const updatedMessages = [...currentMessages];
          if (updatedMessages.length > 0) {
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              prism_data: details
            };
          }
          return updatedMessages;
        });

        // Dispatch details event
        const detailsEvent = new CustomEvent('showDetails', {
          detail: {
            details,
            messageId: 'current',
            isStreaming: true
          }
        });
        document.dispatchEvent(detailsEvent);

        // Also dispatch baseline event if baselineResponse exists
        if (details.baselineResponse) {
          const baselineEvent = new CustomEvent('showBaseline', {
            detail: {
              baseline: details.baselineResponse,
              messageId: 'current',
              isStreaming: true
            }
          });
          document.dispatchEvent(baselineEvent);
        }
      }
    });
  }, [dataStream, setMessages]);

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-6 py-6">
        {messages.map((message) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            vote={votes?.find((vote) => vote.messageId === message.id)}
            isLoading={isLoading}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
          />
        ))}
        {isLoading && <ThinkingMessage message={thinkingMessage} />}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
}
