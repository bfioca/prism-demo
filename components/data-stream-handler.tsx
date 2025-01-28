'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { BlockKind } from './block';
import { Suggestion } from '@/lib/db/schema';
import { initialBlockData, useBlock } from '@/hooks/use-block';
import { useUserMessageId } from '@/hooks/use-user-message-id';
import { cx } from 'class-variance-authority';
import { ThinkingMessage } from './message';

type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'user-message-id'
    | 'kind'
    | 'thinking'
    | 'details';
  content: string | Suggestion;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setBlock } = useBlock();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'user-message-id') {
        setUserMessageIdFromServer(delta.content as string);
        return;
      }

      setBlock((draftBlock) => {
        if (!draftBlock) {
          return { ...initialBlockData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftBlock,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftBlock,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftBlock,
              kind: delta.content as BlockKind,
              status: 'streaming',
            };

          case 'text-delta':
            return {
              ...draftBlock,
              content: draftBlock.content + (delta.content as string),
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 400 &&
                draftBlock.content.length < 450
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'code-delta':
            return {
              ...draftBlock,
              content: delta.content as string,
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 300 &&
                draftBlock.content.length < 310
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'clear':
            return {
              ...draftBlock,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftBlock,
              status: 'idle',
            };

          case 'thinking':
            return {
              ...draftBlock,
              thinkingMessage: delta.content as string,
              status: 'streaming',
            };

          default:
            return draftBlock;
        }
      });
    });
  }, [dataStream, setBlock, setUserMessageIdFromServer]);

  return null;
}

export function ChatStreamHandler({
  dataStream
}: {
  dataStream: any[] | undefined
}) {
  const lastProcessedIndex = useRef(-1);
  const [thinkingMessage, setThinkingMessage] = useState<string>('');

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'thinking') {
        setThinkingMessage(delta.content as string);
      } else if (delta.type === 'details') {
        const event = new CustomEvent('showDetails', {
          detail: {
            details: JSON.parse(delta.content as string),
            messageId: 'current'
          }
        });
        document.dispatchEvent(event);
      }
    });
  }, [dataStream]);

  return <ThinkingMessage message={thinkingMessage} />;
}
