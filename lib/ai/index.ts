import { extractReasoningMiddleware, experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { groq } from '@ai-sdk/groq';
import { createTogetherAI, togetherai } from '@ai-sdk/togetherai';
import { createPortkey } from '@portkey-ai/vercel-provider';

const portkeyConfig = {
  provider: 'openai',
  api_key: process.env.OPENAI_API_KEY,
  override_params: {
    user: 'PRISM',
    environment: process.env.NODE_ENV,
  },
};

export const portkey = createPortkey({
  apiKey: process.env.PORTKEY_API_KEY,
  config: portkeyConfig,
});

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  if (apiIdentifier.includes('deepseek-r1')) {
    return wrapLanguageModel({
      model: groq(apiIdentifier),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  } else if (apiIdentifier.includes('deepseek-ai')) {
    return togetherai(apiIdentifier);
  } else {
    return wrapLanguageModel({
      model: portkey.chatModel(apiIdentifier),
      middleware: customMiddleware,
    })
  }
};
