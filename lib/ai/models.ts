// Define your models here.
import { isAdmin } from '@/lib/utils';
import type { Model } from '@/lib/types';

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'For fast default LLM output',
    restricted: false,
    rateLimited: false,
    provider: 'openai',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For default LLM output',
    restricted: false,
    rateLimited: false,
    provider: 'openai',
  },
  {
    id: 'gpt-4.1',
    label: 'GPT 4.1',
    apiIdentifier: 'gpt-4.1',
    description: 'Better instruction following',
    restricted: false,
    rateLimited: false,
    provider: 'openai',
  },
  {
    id: 'o4-mini',
    label: 'o4 mini',
    apiIdentifier: 'o4-mini',
    description: 'For OpenAI reasoning',
    restricted: false,
    rateLimited: false,
    provider: 'openai',
  },
  {
    id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    label: 'Mixtral-8x22B-Instruct-v0.1',
    apiIdentifier: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    description: 'For a more permissive baseline',
    restricted: false,
    rateLimited: false,
    provider: 'together',
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    label: 'DeepSeek R1',
    apiIdentifier: 'deepseek-ai/DeepSeek-R1',
    description: 'For open source reasoning',
    restricted: false,
    rateLimited: false,
    provider: 'together',
  },
  // {
  //   id: 'deepseek-r1-distill-llama-70b',
  //   label: 'DeepSeek R1 (distill-llama-70b)',
  //   apiIdentifier: 'deepseek-r1-distill-llama-70b',
  //   description: 'For open source reasoning',
  //   restricted: false,
  //   rateLimited: false,
  //   provider: 'groq',
  // },
  // {
  //   id: 'o1',
  //   label: 'o1',
  //   apiIdentifier: 'o1',
  //   description: 'Best at reasoning',
  // }
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';

export function getModelsForUser(user: { admin?: boolean } | null | undefined): Array<Model> {
  if (isAdmin(user)) {
    return models;
  }
  return models.filter(model => !model.restricted);
}
