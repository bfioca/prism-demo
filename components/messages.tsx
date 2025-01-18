import { Message } from 'ai';
import { Vote } from '@/lib/db/schema';
import { PreviewMessage, ThinkingMessage } from './message';
import { useEffect, useRef, useState } from 'react';

type DataStreamDelta = {
  type: 'thinking' | string;
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
  const [thinkingMessage, setThinkingMessage] = useState<string>('Thinking...');
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'thinking') {
        setThinkingMessage(delta.content);
      }
    });
  }, [dataStream]);

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
