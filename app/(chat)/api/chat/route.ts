import {
  convertToCoreMessages,
  createDataStreamResponse,
  generateText,
  smoothStream,
  streamObject,
  streamText,
  type CoreUserMessage
} from 'ai';
import { z } from 'zod';
import { headers } from 'next/headers';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
} from '@/lib/db/queries';
import type { Message, AllowedTools, DocumentSuggestion } from '@/lib/types';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { checkRateLimit } from '@/lib/redis';

import { generateTitleFromUserMessage } from '../../actions';
import { processPrismResponse } from '@/lib/ai/prism';

export const maxDuration = 300; // 5 minutes

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
    mode,
  }: { id: string; messages: Array<Message>; modelId: string; mode: 'chat' | 'prism' } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get IP address from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

  // Check rate limit
  const rateLimitResult = await checkRateLimit(session.user.id, ip);

  // Add rate limit headers
  const rateLimitHeaders = {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.reset.toString(),
  };

  if (!rateLimitResult.isAllowed) {
    return new Response('Rate limit exceeded. Please try again later.', {
      status: 429,
      headers: {
        ...rateLimitHeaders,
        'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
      },
    });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const userMessageWithId = {
    ...userMessage,
    id: generateUUID()
  } as Message;

  let chat: Awaited<ReturnType<typeof getChatById>> | undefined;

  if (mode !== 'prism') {
    // Only fetch / create chats eagerly for standard chat mode to avoid delaying
    // the initial streaming update for prism mode.
    chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessageWithId });
      await saveChat({ id, userId: session.user.id, title });
    }
  }

  if (mode === 'prism') {
    return createDataStreamResponse({
      onError: (error: unknown) => {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return errorMessage;
      },
      execute: async (dataStream) => {
        // Immediately notify the client that we have started processing the request.
        dataStream.writeData({
          type: 'thinking',
          content: '(1/5) Getting responses from each perspective...',
        });

        // Ensure the chat record exists (do this AFTER we've sent the initial
        // event so the user sees feedback immediately).
        let chatRecord = chat;
        if (!chatRecord) {
          chatRecord = await getChatById({ id });
          if (!chatRecord) {
            const title = await generateTitleFromUserMessage({ message: userMessageWithId });
            await saveChat({ id, userId: session.user.id, title });
          }
        }

        const result = await processPrismResponse({
          dataStream,
          model,
          messages,
          session,
          userMessage: userMessageWithId,
          chatId: id
        });
        result.mergeIntoDataStream(dataStream);
      },
    });
  } else {
    // This is the chat mode from the original source code - selectable in mode-selector.tsx
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: customModel(model.apiIdentifier),
          system: systemPrompt,
          messages: coreMessages,
          maxSteps: 5,
          experimental_activeTools: allTools,
          tools: {
            getWeather: {
              description: 'Get the current weather at a location',
              parameters: z.object({
                latitude: z.number(),
                longitude: z.number(),
              }),
              execute: async ({ latitude, longitude }) => {
                const response = await fetch(
                  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
                );

                const weatherData = await response.json();
                return weatherData;
              },
            },
            createDocument: {
              description:
                'Create a document for a writing activity. This tool will call other functions that will generate the contents of the document based on the title and kind.',
              parameters: z.object({
                title: z.string(),
                kind: z.enum(['text', 'code']),
              }),
              execute: async ({ title, kind }) => {
                const id = generateUUID();
                let draftText = '';

                dataStream.writeData({
                  type: 'id',
                  content: id,
                });

                dataStream.writeData({
                  type: 'title',
                  content: title,
                });

                dataStream.writeData({
                  type: 'kind',
                  content: kind,
                });

                dataStream.writeData({
                  type: 'clear',
                  content: '',
                });

                if (kind === 'text') {
                  const { fullStream } = streamText({
                    model: customModel(model.apiIdentifier),
                    system:
                      'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
                    prompt: title,
                    temperature: model.apiIdentifier === 'o4-mini' ? undefined : 0.2,
                  });

                  for await (const delta of fullStream) {
                    const { type } = delta;

                    if (type === 'text-delta') {
                      const { textDelta } = delta;

                      draftText += textDelta;
                      dataStream.writeData({
                        type: 'text-delta',
                        content: textDelta,
                      });
                    }
                  }

                  dataStream.writeData({ type: 'finish', content: '' });
                } else if (kind === 'code') {
                  const { fullStream } = streamObject({
                    model: customModel(model.apiIdentifier),
                    system: codePrompt,
                    prompt: title,
                    temperature: model.apiIdentifier === 'o4-mini' ? undefined : 0.2,
                    schema: z.object({
                      code: z.string(),
                    }),
                  });

                  for await (const delta of fullStream) {
                    const { type } = delta;

                    if (type === 'object') {
                      const { object } = delta;
                      const { code } = object;

                      if (code) {
                        dataStream.writeData({
                          type: 'code-delta',
                          content: code ?? '',
                        });

                        draftText = code;
                      }
                    }
                  }

                  dataStream.writeData({ type: 'finish', content: '' });
                }

                if (session.user?.id) {
                  await saveDocument({
                    id,
                    title,
                    kind,
                    content: draftText,
                    userId: session.user.id,
                  });
                }

                return {
                  id,
                  title,
                  kind,
                  content:
                    'A document was created and is now visible to the user.',
                };
              },
            },
            updateDocument: {
              description: 'Update a document with the given description.',
              parameters: z.object({
                id: z.string().describe('The ID of the document to update'),
                description: z
                  .string()
                  .describe('The description of changes that need to be made'),
              }),
              execute: async ({ id, description }) => {
                const document = await getDocumentById({ id });

                if (!document) {
                  return {
                    error: 'Document not found',
                  };
                }

                const { content: currentContent } = document;
                let draftText = '';

                dataStream.writeData({
                  type: 'clear',
                  content: document.title,
                });

                if (document.kind === 'text') {
                  const { fullStream } = streamText({
                    model: customModel(model.apiIdentifier),
                    system: updateDocumentPrompt(currentContent, 'text'),
                    prompt: description,
                    temperature: model.apiIdentifier === 'o4-mini' ? undefined : 0.2,
                  });

                  for await (const delta of fullStream) {
                    const { type } = delta;

                    if (type === 'text-delta') {
                      const { textDelta } = delta;

                      draftText += textDelta;
                      dataStream.writeData({
                        type: 'text-delta',
                        content: textDelta,
                      });
                    }
                  }

                  dataStream.writeData({ type: 'finish', content: '' });
                } else if (document.kind === 'code') {
                  const { fullStream } = streamObject({
                    model: customModel(model.apiIdentifier),
                    system: updateDocumentPrompt(currentContent, 'code'),
                    prompt: description,
                    temperature: model.apiIdentifier === 'o4-mini' ? undefined : 0.2,
                    schema: z.object({
                      code: z.string(),
                    }),
                  });

                  for await (const delta of fullStream) {
                    const { type } = delta;

                    if (type === 'object') {
                      const { object } = delta;
                      const { code } = object;

                      if (code) {
                        dataStream.writeData({
                          type: 'code-delta',
                          content: code ?? '',
                        });

                        draftText = code;
                      }
                    }
                  }

                  dataStream.writeData({ type: 'finish', content: '' });
                }

                if (session.user?.id) {
                  await saveDocument({
                    id,
                    title: document.title,
                    content: draftText,
                    kind: document.kind,
                    userId: session.user.id,
                  });
                }

                return {
                  id,
                  title: document.title,
                  kind: document.kind,
                  content: 'The document has been updated successfully.',
                };
              },
            },
            requestSuggestions: {
              description: 'Request suggestions for a document',
              parameters: z.object({
                documentId: z
                  .string()
                  .describe('The ID of the document to request edits'),
              }),
              execute: async ({ documentId }) => {
                const document = await getDocumentById({ id: documentId });

                if (!document || !document.content) {
                  return {
                    error: 'Document not found',
                  };
                }

                const suggestions: Array<
                  Omit<DocumentSuggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
                > = [];

                const { elementStream } = streamObject({
                  model: customModel(model.apiIdentifier),
                  system:
                    'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
                  prompt: document.content,
                  temperature: model.apiIdentifier === 'o4-mini' ? undefined : 0.2,
                  output: 'array',
                  schema: z.object({
                    originalSentence: z
                      .string()
                      .describe('The original sentence'),
                    suggestedSentence: z
                      .string()
                      .describe('The suggested sentence'),
                    description: z
                      .string()
                      .describe('The description of the suggestion'),
                  }),
                });

                for await (const element of elementStream) {
                  const suggestion = {
                    originalText: element.originalSentence,
                    suggestedText: element.suggestedSentence,
                    description: element.description,
                    id: generateUUID(),
                    documentId: documentId,
                    isResolved: false,
                  };

                  dataStream.writeData({
                    type: 'suggestion',
                    content: suggestion,
                  });

                  suggestions.push(suggestion);
                }

                if (session.user?.id) {
                  const userId = session.user.id;

                  await saveSuggestions({
                    suggestions: suggestions.map((suggestion) => ({
                      ...suggestion,
                      userId,
                      createdAt: new Date(),
                      documentCreatedAt: document.createdAt,
                    })),
                  });
                }

                return {
                  id: documentId,
                  title: document.title,
                  kind: document.kind,
                  message: 'Suggestions have been added to the document',
                };
              },
            },
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const responseMessagesWithoutIncompleteToolCalls =
                  sanitizeResponseMessages(response.messages);

                await saveMessages({
                  messages: responseMessagesWithoutIncompleteToolCalls.map(
                    (message) => {
                      const messageId = generateUUID();

                      if (message.role === 'assistant') {
                        dataStream.writeMessageAnnotation({
                          messageIdFromServer: messageId,
                        });
                      }

                      return {
                        id: messageId,
                        chatId: id,
                        role: message.role,
                        content: message.content,
                        createdAt: new Date(),
                      };
                    },
                  ),
                });
              } catch (error) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
