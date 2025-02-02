// Define your models here.
import { isPSLEmail } from '@/lib/utils';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  restricted: boolean;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
    restricted: false,
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
    restricted: true,
  },
  {
    id: 'o3-mini',
    label: 'o3 mini',
    apiIdentifier: 'o3-mini',
    description: 'Fast at advanced reasoning',
    restricted: false,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    label: 'DeepSeek R1',
    apiIdentifier: 'deepseek-ai/DeepSeek-R1',
    description: 'For fast reasoning',
    restricted: false
  },
  // {
  //   id: 'deepseek-r1-distill-llama-70b',
  //   label: 'DeepSeek R1',
  //   apiIdentifier: 'deepseek-r1-distill-llama-70b',
  //   description: 'For fast reasoning',
  // },
  // {
  //   id: 'o1-mini',
  //   label: 'o1 mini',
  //   apiIdentifier: 'o1-mini',
  //   description: 'Faster at reasoning',
  // },
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
