import {
  convertToCoreMessages,
  createDataStreamResponse,
  generateText,
  smoothStream,
  streamObject,
  streamText,
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
import type { Suggestion } from '@/lib/db/schema';
import type { Message } from '@/lib/types';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { checkRateLimit } from '@/lib/redis';

import { generateTitleFromUserMessage } from '../../actions';
import { perspectivePrompts } from './prompts/perspective';
import { finalSynthesisPrompt, multiPerspectiveSynthesisPrompt } from './prompts/synthesize';
import { conflictPromptMaps } from './prompts/conflict';
import { multiPerspectiveMediationPrompt } from './prompts/mediations';
import { WORLDVIEWS } from './prompts/worldviews';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

interface PerspectiveResponse {
  text: string;
  worldview: {
    name: string;
    index: number;
  };
}

interface PerspectiveData {
  perspective: string;
  response: string;
  worldviewIndex: number;
}

// Helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const intermediaryData = {
  baselineResponse: '',
  perspectives: [] as PerspectiveData[],
  firstPassSynthesis: '',
  evaluations: [] as PerspectiveData[],
  mediation: '',
};

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
  const headersList = headers();
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

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  if (mode === 'prism') {
    return createDataStreamResponse({
      onError: (error) => {
        console.error('Error:', error);
        return 'Error ' + error;
      },
      execute: async (dataStream) => {
        dataStream.writeData({
          type: 'thinking',
          content: '(1/5) Getting responses from each perspective...',
        });

        let perspectiveResponses: PerspectiveResponse[];
        if (model.apiIdentifier.includes('deepseek')) {
          // Sequential execution for DeepSeek models
          perspectiveResponses = [];
          for (let i = 0; i < perspectivePrompts.length; i++) {
            if (i > 0) await delay(5000); // 5 second delay between iterations
            console.info('Generating text for perspective...');
            const { text } = await generateText({
              model: customModel(model.apiIdentifier),
              messages: [{ role: 'system', content: perspectivePrompts[i] }, ...messages],
              temperature: 0.2,
            });
            console.info('Generated text for perspective:', text);
            intermediaryData.perspectives.push({
              perspective: WORLDVIEWS[i],
              response: text,
              worldviewIndex: i
            });
            dataStream.writeData({
              type: 'details',
              content: JSON.stringify(intermediaryData)
            });
            perspectiveResponses.push({
              text,
              worldview: {
                name: WORLDVIEWS[i],
                index: i
              }
            });
          }
        } else {
          // Parallel execution for other models
          perspectiveResponses = await Promise.all(perspectivePrompts.map(async (prompt, index) => {
            console.info('Generating text for perspective...');
            const { text } = await generateText({
              model: customModel(model.apiIdentifier),
              messages: [{ role: 'system', content: prompt }, ...messages],
              temperature: 0.2,
            });
            console.info('Generated text for perspective:', text);
            const worldview = {
              name: WORLDVIEWS[index],
              index: index
            };
            intermediaryData.perspectives.push({
              perspective: worldview.name,
              response: text,
              worldviewIndex: index
            });
            dataStream.writeData({
              type: 'details',
              content: JSON.stringify(intermediaryData)
            });
            return { text, worldview } as PerspectiveResponse;
          }));
        }

        console.info('All perspectives responses:', perspectiveResponses);

        const parallelModes = ['baseline', 'synthesis'];
        let baselineResponse: string, firstPassResponse: string;

        if (model.apiIdentifier.includes('deepseek')) {
          // Sequential execution for DeepSeek models
          baselineResponse = await generateText({
            model: customModel(model.apiIdentifier),
            messages: messages,
            temperature: 0.2,
          }).then(res => res.text);

          await delay(5000); // 5 second delay between calls

          dataStream.writeData({ type: 'thinking', content: '(2/5) Synthesizing the responses...' });
          firstPassResponse = await generateText({
            model: customModel(model.apiIdentifier),
            messages: [
              {
                role: 'system',
                content: multiPerspectiveSynthesisPrompt(
                  messages[messages.length - 1].content as string,
                  perspectiveResponses.map(r => r.text)
                )
              },
              ...messages
            ],
            temperature: 0.2,
          }).then(res => res.text);
        } else {
          // Parallel execution for other models
          [baselineResponse, firstPassResponse] = await Promise.all(
            parallelModes.map(async (mode) => {
              if (mode === 'baseline') {
                const { text } = await generateText({
                  model: customModel(model.apiIdentifier),
                  messages: messages,
                  temperature: 0.2,
                });
                return text;
              } else {
                dataStream.writeData({ type: 'thinking', content: '(2/5) Synthesizing the responses...' });
                const { text } = await generateText({
                  model: customModel(model.apiIdentifier),
                  messages: [
                    {
                      role: 'system',
                      content: multiPerspectiveSynthesisPrompt(
                        messages[messages.length - 1].content as string,
                        perspectiveResponses.map(r => r.text)
                      )
                    },
                    ...messages
                  ],
                  temperature: 0.2,
                });
                return text;
              }
            })
          );
        }

        intermediaryData.baselineResponse = baselineResponse;
        intermediaryData.firstPassSynthesis = firstPassResponse;
        dataStream.writeData({
          type: 'details',
          content: JSON.stringify(intermediaryData)
        });

        console.info('Synthesized text:', firstPassResponse);
        dataStream.writeData({ type: 'thinking', content: '(3/5) Evaluating the first pass response...' });

        let evaluationResponses;
        if (model.apiIdentifier.includes('deepseek')) {
          // Sequential execution for DeepSeek models
          evaluationResponses = [];
          for (const promptMap of conflictPromptMaps) {
            if (evaluationResponses.length > 0) await delay(5000); // 5 second delay between iterations
            console.info('Generating text for evaluation pass...');
            const { text } = await generateText({
              model: customModel(model.apiIdentifier),
              messages: [{ role: 'system', content: promptMap.prompt }, ...messages],
              temperature: 0.2,
            });
            console.info('Generated text for evaluation:', text);
            intermediaryData.evaluations.push({
              perspective: promptMap.perspective,
              response: text,
              worldviewIndex: conflictPromptMaps.findIndex(p => p.perspective === promptMap.perspective)
            });
            dataStream.writeData({
              type: 'details',
              content: JSON.stringify(intermediaryData)
            });
            evaluationResponses.push({ text, perspective: promptMap.perspective });
          }
        } else {
          // Parallel execution for other models
          evaluationResponses = await Promise.all(conflictPromptMaps.map(async (promptMap) => {
            console.info('Generating text for evaluation pass...');
            const { text } = await generateText({
              model: customModel(model.apiIdentifier),
              messages: [{ role: 'system', content: promptMap.prompt }, ...messages],
              temperature: 0.2,
            });
            console.info('Generated text for evaluation:', text);
            intermediaryData.evaluations.push({
              perspective: promptMap.perspective,
              response: text,
              worldviewIndex: conflictPromptMaps.findIndex(p => p.perspective === promptMap.perspective)
            });
            dataStream.writeData({
              type: 'details',
              content: JSON.stringify(intermediaryData)
            });
            return { text, perspective: promptMap.perspective };
          }));
        }

        console.info('Evaluation responses:', evaluationResponses);
        dataStream.writeData({ type: 'thinking', content: '(4/5) Mediating the responses...' });

        if (model.apiIdentifier.includes('deepseek')) {
          await delay(15000); // 5 second delay between calls
        }

        const mediationPrompt = multiPerspectiveMediationPrompt(
          messages[messages.length - 1].content as string,
          evaluationResponses.map((r) => r.perspective),
          firstPassResponse,
          evaluationResponses.map((r) => r.text)
        );

        console.info('Mediation prompt:', mediationPrompt);
        const mediationResult = await generateText({
          model: customModel(model.apiIdentifier),
          messages: [{ role: 'system', content: mediationPrompt }, ...messages],
          temperature: 0.2,
        });

        intermediaryData.mediation = mediationResult.text;
        dataStream.writeData({
          type: 'details',
          content: JSON.stringify(intermediaryData)
        });

        console.info('Mediation result:', mediationResult.text);
        console.info('Complete intermediary data:', intermediaryData);

        dataStream.writeData({ type: 'thinking', content: '(5/5) Synthesizing final response...' });

        const finalPrompt = finalSynthesisPrompt(
          messages[messages.length - 1].content as string,
          WORLDVIEWS,
          firstPassResponse,
          mediationResult.text
        );
        console.info('Final synthesis prompt:', finalPrompt);

        if (model.apiIdentifier.includes('deepseek')) {
          await delay(15000); // 5 second delay between calls
        }

        const result = streamText({
          model: customModel(model.apiIdentifier),
          messages: [{ role: 'system', content: finalPrompt }, ...messages],
          temperature: 0.2,
          experimental_generateMessageId: generateUUID,
          experimental_transform: smoothStream({ chunking: 'word' }),
          onChunk: (chunk) => {
            dataStream.writeData({ type: 'thinking', content: null });
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                console.log('Response messages:', response.messages);

                // Since we only get one assistant message back
                const assistantMessage = response.messages[0];

                await saveMessages({
                  messages: [
                    {
                      ...userMessage,
                      id: generateUUID(), // Generate a new ID for user message
                      chatId: id,
                      createdAt: new Date(),
                    },
                    {
                      id: assistantMessage.id,
                      chatId: id,
                      role: 'assistant',
                      content: assistantMessage.content,
                      createdAt: new Date(),
                      prism_data: intermediaryData
                    }
                  ],
                });
              } catch (error) {
                console.error('Failed to save chat - Error:', error);
                console.error('Error details:', {
                  name: (error as Error).name,
                  message: (error as Error).message,
                  stack: (error as Error).stack
                });
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
  } else {
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
                    experimental_providerMetadata: {
                      openai: {
                        prediction: {
                          type: 'content',
                          content: currentContent,
                        },
                      },
                    },
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
                  Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
                > = [];

                const { elementStream } = streamObject({
                  model: customModel(model.apiIdentifier),
                  system:
                    'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
                  prompt: document.content,
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
