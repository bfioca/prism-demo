'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';

interface ExtendedMessage extends Message {
  keyAssumptions?: string;
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
  const [keyAssumptions, setKeyAssumptions] = useState<string[]>([]);

  const {
    messages: rawMessages,
    setMessages: setRawMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    data: dataStream,
  } = useChat({
    id,
    body: { id, modelId: selectedModelId, mode: mode },
    initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  // Process messages to extract key assumptions
  const messages = rawMessages.map((message) => {
    if (message.role === 'assistant' && message.content) {
      const content = message.content as string;
      const keyAssumptionsMatch = content.match(/Key Assumptions:\s*([\s\S]*?)\s*Response:/);
      const responseMatch = content.match(/Response:\s*([\s\S]*)/);

      if (keyAssumptionsMatch && responseMatch) {
        const keyAssumptions = keyAssumptionsMatch[1].trim();
        // Keep the original content but add the processed parts as properties
        return {
          ...message,
          keyAssumptions,
          content: content // Keep the original content
        };
      }
    }
    return message;
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
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
              setInput={setInput}
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
