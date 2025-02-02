import { generateText, smoothStream, streamText } from 'ai';
import { Session } from 'next-auth';
import { Message } from '@/lib/types';
import { perspectivePrompts } from './prompts/perspective';
import { multiPerspectiveSynthesisPrompt, finalSynthesisPrompt } from './prompts/synthesize';
import { conflictPromptMaps } from './prompts/conflict';
import { WORLDVIEWS, WORLDVIEW_PERSPECTIVES } from './prompts/worldviews';
import { multiPerspectiveMediationPrompt } from './prompts/mediations';
import { generateUUID } from '@/lib/utils';
import { customModel } from '@/lib/ai';
import { saveMessages } from '@/lib/db/queries';

// Helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface DataStream {
  writeData: (delta: { type: 'thinking' | 'details' | string; content: string | null }) => void;
}

interface PerspectiveResponse {
  text: string;
  worldview: {
    name: string;
    index: number;
  };
}

interface PerspectiveData {
  id: string;
  perspective: string;
  response: string;
  worldviewIndex: number;
}

interface IntermediaryData {
  baselineResponse: string;
  perspectives: PerspectiveData[];
  firstPassSynthesis: string;
  evaluations: PerspectiveData[];
  mediation: string;
  isPrismMode: boolean;
}

interface ProcessPrismParams {
  dataStream: DataStream;
  model: {
    apiIdentifier: string;
  };
  messages: Message[];
  session: Session | null;
  userMessage: Message;
  chatId: string;
}

export async function processPrismResponse({
  dataStream,
  model,
  messages,
  session,
  userMessage,
  chatId
}: ProcessPrismParams) {
  // Initialize intermediary data
  const intermediaryData: IntermediaryData = {
    baselineResponse: '',
    perspectives: [],
    firstPassSynthesis: '',
    evaluations: [],
    mediation: '',
    isPrismMode: true
  };

  dataStream.writeData({
    type: 'thinking',
    content: '(1/5) Getting responses from each perspective...',
  });

  dataStream.writeData({
    type: 'details',
    content: JSON.stringify(intermediaryData)
  });

  let perspectiveResponses: PerspectiveResponse[];
  if (model.apiIdentifier.includes('distill-llama')) {
    // Sequential execution for rate limited models like from groq
    perspectiveResponses = [];
    for (let i = 0; i < perspectivePrompts.length; i++) {
      if (i > 0) await delay(5000); // 5 second delay between iterations
      console.info('Generating text for perspective...');
      const { text } = await generateText({
        model: customModel(model.apiIdentifier),
        messages: [{ role: 'system', content: perspectivePrompts[i] }, ...messages],
        temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
      });
      console.info('Generated text for perspective:', text);
      intermediaryData.perspectives.push({
        id: generateUUID(),
        perspective: WORLDVIEW_PERSPECTIVES[i],
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
        temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
      });
      console.info('Generated text for perspective:', text);
      const worldview = {
        name: WORLDVIEWS[index],
        index: index
      };
      intermediaryData.perspectives.push({
        id: generateUUID(),
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

  if (model.apiIdentifier.includes('distill-llama')) {
    // Sequential execution for rate limited models
    baselineResponse = await generateText({
      model: customModel(model.apiIdentifier),
      messages: messages,
      temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
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
      temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
    }).then(res => res.text);
  } else {
    // Parallel execution for other models
    [baselineResponse, firstPassResponse] = await Promise.all(
      parallelModes.map(async (mode) => {
        if (mode === 'baseline') {
          const { text } = await generateText({
            model: customModel(model.apiIdentifier),
            messages: messages,
            temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
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
            temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
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
  if (model.apiIdentifier.includes('distill-llama')) {
    // Sequential execution for groq models
    evaluationResponses = [];
    for (const promptMap of conflictPromptMaps) {
      if (evaluationResponses.length > 0) await delay(5000); // 5 second delay between iterations
      console.info('Generating text for evaluation pass...');
      const { text } = await generateText({
        model: customModel(model.apiIdentifier),
        messages: [{ role: 'system', content: promptMap.prompt }, ...messages],
        temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
      });
      console.info('Generated text for evaluation:', text);
      intermediaryData.evaluations.push({
        id: generateUUID(),
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
        temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
      });
      console.info('Generated text for evaluation:', text);
      intermediaryData.evaluations.push({
        id: generateUUID(),
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

  if (model.apiIdentifier.includes('distill-llama')) {
    await delay(15000);
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
    temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
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

  if (model.apiIdentifier.includes('distill-llama')) {
    await delay(15000);
  }

  const result = streamText({
    model: customModel(model.apiIdentifier),
    messages: [{ role: 'system', content: finalPrompt }, ...messages],
    temperature: model.apiIdentifier === 'o3-mini' ? undefined : 0.2,
    experimental_generateMessageId: generateUUID,
    experimental_transform: smoothStream({ chunking: 'word' }),
    onChunk: (chunk) => {
      dataStream.writeData({ type: 'thinking', content: null });
    },
    onFinish: async ({ response }) => {
      if (session?.user?.id) {
        try {
          console.log('Response messages:', response.messages);

          // Since we only get one assistant message back
          const assistantMessage = response.messages[0];

          await saveMessages({
            messages: [
              {
                ...userMessage,
                id: generateUUID(), // Generate a new ID for user message
                chatId,
                createdAt: new Date(),
              },
              {
                id: assistantMessage.id,
                chatId,
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

  return result;
}
