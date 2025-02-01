import { ARCHAIC_WORLDVIEW, EMOTIONAL_WORLDVIEW, SOCIAL_WORLDVIEW, RATIONAL_WORLDVIEW, PLURALISTIC_WORLDVIEW, NARRATIVE_INTEGRATED_WORLDVIEW, NONDUAL_WORLDVIEW } from './worldviews';

// System Prompt Template
const CONFLICT_PROMPT_TEMPLATE = `
# Instructions

Evaluate the "First Pass Response" from the perspective provided below. Identify meaningful conflicts or tensions where the response undermines or fails to address the perspective's core concerns, priorities, or reasoning style. Do not include minor or cosmetic issues. Characterize each conflict by its nature and degree of impact. If the response aligns well with the perspective and no significant conflicts exist, state "No significant conflicts identified."

## Perspective:
<<PERSPECTIVE_PLACEHOLDER>>

## Output Schema:

The following is the output schema for the conflict prompt:

## Conflicts:
   - **Conflict Description**: [Concisely describe the core conflict or tension only if meaningful.]
   - **Degree of Impact**: [Critical, High, Moderate, or Low]. Use "N/A" if no conflicts are identified.
`;

function createConflictPrompt(perspective: string): string {
  return CONFLICT_PROMPT_TEMPLATE.replace('<<PERSPECTIVE_PLACEHOLDER>>', perspective);
}

const archaicConflictPrompt = createConflictPrompt(ARCHAIC_WORLDVIEW);
const emotionalConflictPrompt = createConflictPrompt(EMOTIONAL_WORLDVIEW);
const socialConflictPrompt = createConflictPrompt(SOCIAL_WORLDVIEW);
const rationalConflictPrompt = createConflictPrompt(RATIONAL_WORLDVIEW);
const pluralisticConflictPrompt = createConflictPrompt(PLURALISTIC_WORLDVIEW);
const narrativeIntegratedConflictPrompt = createConflictPrompt(NARRATIVE_INTEGRATED_WORLDVIEW);
const nondualConflictPrompt = createConflictPrompt(NONDUAL_WORLDVIEW);

// array of prompts
export const conflictPromptMaps = [
  { prompt: archaicConflictPrompt, perspective: ARCHAIC_WORLDVIEW },
  { prompt: emotionalConflictPrompt, perspective: EMOTIONAL_WORLDVIEW },
  { prompt: socialConflictPrompt, perspective: SOCIAL_WORLDVIEW },
  { prompt: rationalConflictPrompt, perspective: RATIONAL_WORLDVIEW },
  { prompt: pluralisticConflictPrompt, perspective: PLURALISTIC_WORLDVIEW },
  { prompt: narrativeIntegratedConflictPrompt, perspective: NARRATIVE_INTEGRATED_WORLDVIEW },
  { prompt: nondualConflictPrompt, perspective: NONDUAL_WORLDVIEW },
];
