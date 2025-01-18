import { generateText, streamText, CoreMessage } from 'ai';
import { multiPerspectiveSynthesisPrompt } from '../chat/prompts/synthesize';
import { perspectivePrompts } from '../chat/prompts/perspective';
import { openai } from '@ai-sdk/openai';
export async function formulatePrismResponse(dataStream: any, messages: CoreMessage[], modelName: string = 'gpt-4o') {

};
