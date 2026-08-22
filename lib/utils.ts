import type {
  AssistantModelMessage,
  ModelMessage,
  ToolModelMessage,
  UIMessage,
} from 'ai';
import { isToolUIPart } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type {
  Attachment,
  LegacyToolInvocation,
  Message,
  IntermediaryData,
} from '@/lib/types';
import type { Message as DBMessage, Document } from '@/lib/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: ToolModelMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) =>
              'toolCallId' in tool &&
              tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: 'output' in toolResult ? toolResult.output : undefined,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as ToolModelMessage,
        messages: chatMessages,
      });
    }

    let textContent = '';
    const toolInvocations: Array<LegacyToolInvocation> = [];

    if (typeof message.content === 'string') {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'text') {
          textContent += content.text;
        } else if (content.type === 'tool-call') {
          toolInvocations.push({
            state: 'call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
    }

    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      parts: [
        ...(textContent ? [{ type: 'text' as const, text: textContent }] : []),
        ...toolInvocations.map((tool) =>
          tool.state === 'result'
            ? {
                type: 'dynamic-tool' as const,
                toolName: tool.toolName,
                toolCallId: tool.toolCallId,
                state: 'output-available' as const,
                input: tool.args,
                output: tool.result,
              }
            : {
                type: 'dynamic-tool' as const,
                toolName: tool.toolName,
                toolCallId: tool.toolCallId,
                state: 'input-available' as const,
                input: tool.args,
              },
        ),
      ],
      content: textContent,
      toolInvocations,
      prism_data: message.prism_data as IntermediaryData | undefined,
    });

    return chatMessages;
  }, []);
}

export function sanitizeResponseMessages(
  messages: Array<ToolModelMessage | AssistantModelMessage>,
): Array<ToolModelMessage | AssistantModelMessage> {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map(normalizeMessage).map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

export function getMostRecentUserMessage(messages: Array<ModelMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function normalizeMessage(message: UIMessage | Message): Message {
  let content = '';
  const experimental_attachments: Attachment[] = [];
  const toolInvocations: LegacyToolInvocation[] = [];

  for (const part of message.parts as any[]) {
    if (part.type === 'text') {
      content += part.text;
    } else if (part.type === 'file') {
      experimental_attachments.push({
        url: part.url,
        name: part.filename,
        contentType: part.mediaType,
      });
    } else if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
      toolInvocations.push({
        toolCallId: part.toolCallId,
        toolName:
          part.type === 'dynamic-tool'
            ? part.toolName
            : part.type.slice('tool-'.length),
        args: part.input,
        state: part.state === 'output-available' ? 'result' : 'call',
        ...(part.state === 'output-available' ? { result: part.output } : {}),
      });
    }
  }

  return {
    ...message,
    content,
    toolInvocations,
    experimental_attachments,
  } as Message;
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getMessageIdFromAnnotations(message: Message) {
  return message.id;
}

export function isAdmin(user: { admin?: boolean } | null | undefined): boolean {
  if (!user) return false;
  return user.admin === true;
}
