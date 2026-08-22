import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { groq } from '@ai-sdk/groq';
import { togetherai } from '@ai-sdk/togetherai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { models } from './models';

const portkeyConfig = {
  provider: 'openai',
  api_key: process.env.OPENAI_API_KEY,
  override_params: {
    user: 'PRISM',
    environment: process.env.NODE_ENV,
  },
};

export const portkey = createOpenAICompatible({
  name: 'portkey',
  baseURL: 'https://api.portkey.ai/v1',
  headers: {
    'x-portkey-api-key': process.env.PORTKEY_API_KEY ?? '',
    'x-portkey-config': JSON.stringify(portkeyConfig),
  },
  includeUsage: true,
});

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  const model = models.find(m => m.apiIdentifier === apiIdentifier);
  if (!model) {
    throw new Error(`Model not found for apiIdentifier: ${apiIdentifier}`);
  }

  switch (model.provider) {
    case 'groq':
      return wrapLanguageModel({
        model: groq(apiIdentifier),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      });
    case 'together':
      return togetherai(apiIdentifier);
    case 'openai':
    default:
      return wrapLanguageModel({
        model: portkey.chatModel(apiIdentifier),
        middleware: customMiddleware,
      });
  }
};
