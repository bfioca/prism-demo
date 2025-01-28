import type { Message } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';
import { PreviewMessage, ThinkingMessage } from './message';
import { useEffect, useRef, useState } from 'react';

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
  const [thinkingMessage, setThinkingMessage] = useState<string>('');
  const lastProcessedIndex = useRef(-1);
  const processedDetails = useRef(new Set<string>());

  useEffect(() => {
    console.log('=== Effect Re-run ===');
    console.log('dataStream changed:', dataStream);
    console.log('=========================');

    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    console.log('=== DataStream Debug ===');
    console.log('Total dataStream length:', dataStream.length);
    console.log('Last processed index:', lastProcessedIndex.current);
    console.log('New deltas:', newDeltas);
    console.log('=========================');

    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'thinking') {
        setThinkingMessage(delta.content);
      } else if (delta.type === 'details') {
        const details = JSON.parse(delta.content);

        // Create a key that reflects the current step
        const detailsKey = [
          details.perspectives?.length && `perspectives:${details.perspectives.length}`,
          details.baselineResponse && 'baseline',
          details.firstPassSynthesis && 'synthesis',
          details.evaluations?.length && `evaluations:${details.evaluations.length}`,
          details.mediation && 'mediation'
        ].filter(Boolean).join('-');

        console.log('=== Processing Details ===');
        console.log('Details key:', detailsKey);
        console.log('Already processed?', processedDetails.current.has(detailsKey));
        console.log('Current processed keys:', [...processedDetails.current]);
        console.log('=========================');

        if (processedDetails.current.has(detailsKey)) {
          console.log('Skipping already processed details');
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
            messageId: 'current'
          }
        });
        document.dispatchEvent(detailsEvent);

        // Also dispatch baseline event if baselineResponse exists
        if (details.baselineResponse && detailsKey.startsWith('baseline:')) {
          console.log('=== Dispatching Baseline Event ===');
          console.log('From messages.tsx');
          const baselineEvent = new CustomEvent('showBaseline', {
            detail: {
              baseline: details.baselineResponse,
              messageId: 'current',
              autoOpen: false
            }
          });
          console.log('Event being dispatched:', baselineEvent);
          document.dispatchEvent(baselineEvent);
          console.log('=========================');
        }
      }
    });
  }, [dataStream, setMessages]);

  return (
    <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
