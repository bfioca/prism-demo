import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { Vote } from '@/lib/db/schema';
import type { ChatRequestOptions } from 'ai';
import type { Message } from '@/lib/types';
import { memo, useEffect, useRef, useState } from 'react';
import equal from 'fast-deep-equal';
import { UIBlock } from './block';

type DataStreamDelta = {
  type: 'thinking' | 'details' | string;
  content: string;
};

interface BlockMessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  blockStatus: UIBlock['status'];
  dataStream?: any[];
}

function PureBlockMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  blockStatus,
  dataStream,
}: BlockMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [thinkingMessage, setThinkingMessage] = useState<string>('');
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'thinking' && isLoading) {
        setThinkingMessage(delta.content);
      } else if (delta.type === 'details') {
        const details = JSON.parse(delta.content);
        // Dispatch details event
        const detailsEvent = new CustomEvent('showDetails', {
          detail: {
            details,
            messageId: 'current'
          }
        });
        document.dispatchEvent(detailsEvent);

        // Also dispatch baseline event if baselineResponse exists
        if (details.baselineResponse) {
          const baselineEvent = new CustomEvent('showBaseline', {
            detail: {
              baseline: details.baselineResponse,
              messageId: 'current',
              autoOpen: false
            }
          });
          document.dispatchEvent(baselineEvent);
        }
      } else {
        setThinkingMessage('');
      }
    });
  }, [dataStream, isLoading]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={isLoading && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {isLoading && blockStatus === 'streaming' && thinkingMessage && thinkingMessage.length > 0 && (
        <ThinkingMessage message={thinkingMessage} />
      )}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const BlockMessages = memo(PureBlockMessages, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.blockStatus !== nextProps.blockStatus) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.dataStream, nextProps.dataStream)) return false;

  return true;
});
