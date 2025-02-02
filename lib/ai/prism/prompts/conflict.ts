// This file contains the prompt for identifying conflicts between the perspectives.

import { ARCHAIC_WORLDVIEW_PERSPECTIVE, EMOTIONAL_WORLDVIEW_PERSPECTIVE, SOCIAL_WORLDVIEW_PERSPECTIVE, RATIONAL_WORLDVIEW_PERSPECTIVE, PLURALISTIC_WORLDVIEW_PERSPECTIVE, NARRATIVE_INTEGRATED_WORLDVIEW_PERSPECTIVE, NONDUAL_WORLDVIEW_PERSPECTIVE } from './worldviews';

// System Prompt Template
const CONFLICT_PROMPT_TEMPLATE = `
# Instructions

Evaluate the "First Pass Response" from the perspective provided below. Identify meaningful conflicts or tensions where the response undermines or fails to address the perspective’s core concerns, priorities, or reasoning style. If the response is simply irrelevant to the perspective (i.e., it neither contradicts nor undermines its concerns), do not consider it a conflict. Do not include minor or cosmetic issues. Characterize each conflict by its nature and degree of impact. If the response aligns well with the perspective and no significant conflicts exist, state "No significant conflicts identified."
## Perspective:
<<PERSPECTIVE_PLACEHOLDER>>

## Output Schema:

The following is the output schema for the conflict prompt:

## Conflicts:
- **Conflict Description**: [In 1-2 sentences briefly describe how the perspective (considering its self-concept, motivations, reasoning styles, and/or views on others) would react to the response, focusing on the **negative outcomes or consequences feared** as a result of the response. Explain how these fears arise from the perspective’s deeper assumptions or priorities.]
- **Degree of Impact**: [Critical, High, Moderate, or Low. Use "N/A" if no conflicts are identified.]

# First Pass Response:
`;

function createConflictPrompt(perspective: string): string {
  return CONFLICT_PROMPT_TEMPLATE.replace('<<PERSPECTIVE_PLACEHOLDER>>', perspective);
}

const archaicConflictPrompt = createConflictPrompt(ARCHAIC_WORLDVIEW_PERSPECTIVE);
const emotionalConflictPrompt = createConflictPrompt(EMOTIONAL_WORLDVIEW_PERSPECTIVE);
const socialConflictPrompt = createConflictPrompt(SOCIAL_WORLDVIEW_PERSPECTIVE);
const rationalConflictPrompt = createConflictPrompt(RATIONAL_WORLDVIEW_PERSPECTIVE);
const pluralisticConflictPrompt = createConflictPrompt(PLURALISTIC_WORLDVIEW_PERSPECTIVE);
const narrativeIntegratedConflictPrompt = createConflictPrompt(NARRATIVE_INTEGRATED_WORLDVIEW_PERSPECTIVE);
const nondualConflictPrompt = createConflictPrompt(NONDUAL_WORLDVIEW_PERSPECTIVE);

// array of prompts
export const conflictPromptMaps = [
  { prompt: archaicConflictPrompt, perspective: ARCHAIC_WORLDVIEW_PERSPECTIVE },
  { prompt: emotionalConflictPrompt, perspective: EMOTIONAL_WORLDVIEW_PERSPECTIVE },
  { prompt: socialConflictPrompt, perspective: SOCIAL_WORLDVIEW_PERSPECTIVE },
  { prompt: rationalConflictPrompt, perspective: RATIONAL_WORLDVIEW_PERSPECTIVE },
  { prompt: pluralisticConflictPrompt, perspective: PLURALISTIC_WORLDVIEW_PERSPECTIVE },
  { prompt: narrativeIntegratedConflictPrompt, perspective: NARRATIVE_INTEGRATED_WORLDVIEW_PERSPECTIVE },
  { prompt: nondualConflictPrompt, perspective: NONDUAL_WORLDVIEW_PERSPECTIVE },
];
