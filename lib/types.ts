import type { Message as BaseMessage } from 'ai';
import type { Session } from 'next-auth';

// Re-export DB Message type
export type { Message as DBMessage } from '@/lib/db/schema';

// Base Message type with Prism data
export interface Message extends BaseMessage {
  prism_data?: IntermediaryData;
}

// Model related types
export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  restricted: boolean;
  rateLimited: boolean;
  provider: string;
}

// Data Stream types
export interface DataStream {
  writeData: (delta: { type: 'thinking' | 'details' | string; content: string | null }) => void;
}

// Prism specific types
export interface PerspectiveResponse {
  text: string;
  worldview: {
    name: string;
    index: number;
  };
}

export interface PerspectiveData {
  id: string;
  perspective: string;
  response: string;
  worldviewIndex: number;
}

export interface IntermediaryData {
  baselineResponse: string;
  perspectives: PerspectiveData[];
  firstPassSynthesis: string;
  evaluations: PerspectiveData[];
  mediation: string;
  isPrismMode: boolean;
}

// Process Prism Parameters
export interface ProcessPrismParams {
  dataStream: DataStream;
  model: Model;
  messages: Message[];
  session: Session | null;
  userMessage: Message;
  chatId: string;
  mode: 'prism' | 'committee' | 'chat';
}

// Tool types
export type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

// Document types
export interface DocumentSuggestion {
  originalText: string;
  suggestedText: string;
  description: string;
  id: string;
  documentId: string;
  isResolved: boolean;
  userId?: string;
  createdAt?: Date;
  documentCreatedAt?: Date;
}
