// Define your models here.
import { isPSLEmail } from '@/lib/utils';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  restricted: boolean;
  rateLimited: boolean;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'For fast default LLM output',
    restricted: false,
    rateLimited: false,
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For default LLM output',
    restricted: true,
    rateLimited: false,
  },
  {
    id: 'o3-mini',
    label: 'o3 mini',
    apiIdentifier: 'o3-mini',
    description: 'For OpenAI reasoning',
    restricted: false,
    rateLimited: false,
  },
  // {
  //   id: 'deepseek-ai/DeepSeek-R1',
  //   label: 'DeepSeek R1',
  //   apiIdentifier: 'deepseek-ai/DeepSeek-R1',
  //   description: 'For open source reasoning',
  //   restricted: false,
  //   rateLimited: false,
  // },
  {
    id: 'deepseek-r1-distill-llama-70b',
    label: 'DeepSeek R1',
    apiIdentifier: 'deepseek-r1-distill-llama-70b',
    description: 'For open source reasoning',
    restricted: false,
    rateLimited: false,
  },
  // {
  //   id: 'o1',
  //   label: 'o1',
  //   apiIdentifier: 'o1',
  //   description: 'Best at reasoning',
  // }
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';

export function getModelsForUser(email: string | null | undefined): Array<Model> {
  if (isPSLEmail(email)) {
    return models;
  }
  return models.filter(model => model.id === DEFAULT_MODEL_NAME || model.id === 'deepseek-ai/DeepSeek-R1');
}
