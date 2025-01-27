import type { Message as BaseMessage } from 'ai';

export interface Message extends BaseMessage {
  prism_data?: any;
}

export type { Message as DBMessage } from '@/lib/db/schema';
