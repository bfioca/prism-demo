import type { ChatRequestOptions, ModelMessage, UIMessage } from 'ai';
import type { Session } from 'next-auth';

// Re-export DB Message type
export type { Message as DBMessage } from '@/lib/db/schema';

export interface Attachment {
  name?: string;
  contentType?: string;
  url: string;
}

export interface LegacyToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: 'call' | 'result';
  result?: any;
}

export interface DataStreamDelta {
  type: string;
  content: unknown;
}

export type AppDataTypes = {
  custom: DataStreamDelta;
};

// Keep the legacy convenience fields while the transport uses AI SDK 6 parts.
export interface Message extends UIMessage<unknown, AppDataTypes> {
  content: string;
  toolInvocations?: LegacyToolInvocation[];
  experimental_attachments?: Attachment[];
  annotations?: Array<Record<string, unknown>>;
  prism_data?: IntermediaryData;
}

export type LegacyCreateMessage = {
  role: Message['role'];
  content: string;
};

export type LegacyAppend = (
  message: Message | LegacyCreateMessage,
  options?: ChatRequestOptions,
) => Promise<void>;

export type LegacyHandleSubmit = (
  event?: { preventDefault?: () => void },
  options?: ChatRequestOptions,
) => void;

export type LegacyReload = (options?: ChatRequestOptions) => Promise<void>;

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
  writeData: (delta: DataStreamDelta) => void;
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
  messages: ModelMessage[];
  session: Session | null;
  userMessage: ModelMessage & { id: string };
  chatId: string;
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
