// This file contains the prompts for generating each perspective.

import { ARCHAIC_WORLDVIEW_PERSPECTIVE, EMOTIONAL_WORLDVIEW_PERSPECTIVE, SOCIAL_WORLDVIEW_PERSPECTIVE, RATIONAL_WORLDVIEW_PERSPECTIVE, PLURALISTIC_WORLDVIEW_PERSPECTIVE, NARRATIVE_INTEGRATED_WORLDVIEW_PERSPECTIVE, NONDUAL_WORLDVIEW_PERSPECTIVE } from './worldviews';

// System Prompt Template
export const PERSPECTIVE_PROMPT_TEMPLATE = `
# Instructions

Interpret the input according to the following perspective. First, identify the key implicit assumptions from the context needed to respond to the input, ensuring they are filtered through the lens of the perspective. Consider how the perspective reinterprets the context to align with its worldview. Then, generate your response based on these assumptions.

## Perspective:
<<PERSPECTIVE_PLACEHOLDER>>

## Output Schema:
1. **List of Key Implicit Assumptions**: Provide the key implicit assumptions about the context that the response relies on.
2. **Response**: Provide a single, coherent response.
`;

export function createPerspectivePrompt(perspective: string): string {
  return PERSPECTIVE_PROMPT_TEMPLATE.replace('<<PERSPECTIVE_PLACEHOLDER>>', perspective);
}

const archaicPerspectivePrompt = createPerspectivePrompt(ARCHAIC_WORLDVIEW_PERSPECTIVE);
const emotionalPerspectivePrompt = createPerspectivePrompt(EMOTIONAL_WORLDVIEW_PERSPECTIVE);
const socialPerspectivePrompt = createPerspectivePrompt(SOCIAL_WORLDVIEW_PERSPECTIVE);
const rationalPerspectivePrompt = createPerspectivePrompt(RATIONAL_WORLDVIEW_PERSPECTIVE);
const pluralisticPerspectivePrompt = createPerspectivePrompt(PLURALISTIC_WORLDVIEW_PERSPECTIVE);
const narrativeIntegratedPerspectivePrompt = createPerspectivePrompt(NARRATIVE_INTEGRATED_WORLDVIEW_PERSPECTIVE);
const nondualPerspectivePrompt = createPerspectivePrompt(NONDUAL_WORLDVIEW_PERSPECTIVE);

// array of prompts
export const perspectivePrompts = [
  archaicPerspectivePrompt,
  emotionalPerspectivePrompt,
  socialPerspectivePrompt,
  rationalPerspectivePrompt,
  pluralisticPerspectivePrompt,
  narrativeIntegratedPerspectivePrompt,
  nondualPerspectivePrompt,
];
