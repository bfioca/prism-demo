'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type CreateUIMessage } from 'ai';
import useSWR, { useSWRConfig } from 'swr';
import { useState } from 'react';

import type {
  Attachment,
  DataStreamDelta,
  LegacyAppend,
  LegacyHandleSubmit,
  LegacyReload,
  Message,
} from '@/lib/types';
import type { VisibilityType } from '@/components/visibility-selector';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, normalizeMessage } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useBlockSelector } from '@/hooks/use-block';

export interface ExtendedMessage extends Message {
  keyAssumptions?: string;
  prism_data?: any;
}

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedMode: initialMode,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedMode: 'prism' | 'chat';
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [mode, setMode] = useState<'prism' | 'chat'>(initialMode);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [error, setError] = useState<{ message: string; retryAfter?: number } | null>(null);

  const [input, setInput] = useState('');
  const [dataStream, setDataStream] = useState<DataStreamDelta[]>([]);

  const {
    messages: rawMessages,
    setMessages: setRawMessages,
    sendMessage,
    status,
    stop,
    regenerate,
  } = useChat<Message>({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport<Message>({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { id, messages, modelId: selectedModelId, mode },
      }),
    }),
    experimental_throttle: 100,
    onData: (part) => {
      if (part.type === 'data-custom') {
        setDataStream((current) => [...current, part.data]);
      }
    },
    onFinish: () => {
      mutate('/api/history');
    },
    onError: (error) => {
      if (error.message.includes('Rate limit exceeded')) {
        // Extract retry time from headers if available
        const retryAfter = (error as any).response?.headers?.get('Retry-After');
        setError({
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: retryAfter ? parseInt(retryAfter) : undefined
        });
        // Remove the last user message since it wasn't processed
        setRawMessages(prev => prev.slice(0, -1));
      } else {
        setError({ message: error.message });
      }
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const createUserMessage = (
    content: string,
    files: Attachment[] = [],
  ): CreateUIMessage<Message> => ({
    role: 'user',
    content,
    parts: [
      { type: 'text', text: content },
      ...files.map((file) => ({
        type: 'file' as const,
        url: file.url,
        filename: file.name,
        mediaType: file.contentType || 'application/octet-stream',
      })),
    ],
  });

  const append: LegacyAppend = async (message, options) => {
    await sendMessage(
      'parts' in message
        ? message
        : createUserMessage(message.content),
      options,
    );
  };

  const handleSubmit: LegacyHandleSubmit = (event, options) => {
    event?.preventDefault?.();
    if (!input.trim() && attachments.length === 0) return;
    void sendMessage(createUserMessage(input, attachments), options);
    setInput('');
  };

  const reload: LegacyReload = async (options) => {
    await regenerate(options);
  };

  // Clear error when input changes
  const handleInputChange = (value: string) => {
    if (error) setError(null);
    setInput(value);
  };

  // Process messages to extract key assumptions
  const messages = rawMessages.map(normalizeMessage);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModelId}
          selectedMode={mode}
          onModeChange={setMode}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        {error && (
          <div className="mx-auto w-full max-w-3xl px-4 py-2">
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">
              <p>{error.message}</p>
              {error.retryAfter && (
                <p className="mt-1">You can try again in {Math.ceil(error.retryAfter / 60)} minutes.</p>
              )}
            </div>
          </div>
        )}

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setRawMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
          dataStream={dataStream}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setRawMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        dataStream={dataStream}
        append={append}
        messages={messages}
        setMessages={setRawMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
