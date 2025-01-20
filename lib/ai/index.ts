import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
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
  return wrapLanguageModel({
    model: portkey.chatModel(apiIdentifier),
    middleware: customMiddleware,
  });
};
