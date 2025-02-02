// This file contains the prompt for synthesizing the perspectives into a single response.

export function multiPerspectiveSynthesisPrompt(
  userMessage: string,
  perspectives: string[]
): string {
  return `
# Instructions

Synthesize the provided perspectives into a single response using the Pareto Optimality Principle.
Ensure the synthesized response maximizes the priorities of each perspective while minimizing tradeoffs
and avoiding disproportionately worsening any perspective's objectives. Use the provided inputs as the
foundation for the synthesis.

## Output Schema:
1. **List of Key Implicit Assumptions**: Provide the key implicit assumptions about the context that the response relies on.
2. **Response**: Provide a single, coherent response that reflects the Pareto Optimal integrated priorities of the perspectives.

# Inputs

## User Message (last message of the conversation below)
${userMessage}

## Perspectives

${perspectives.map((p, i) => `${i + 1}. ${p}`).join('\n')}
---
  `;
}

export const finalSynthesisPrompt = (
  userMessage: string,
  perspectives: string[],
  firstPassResponse: string,
  mediations: string,
) => {
  return `
# Instructions
Synthesize the provided perspectives into a single response using the Pareto Optimality Principle.
Ensure the synthesized response maximizes the priorities of each perspective while minimizing tradeoffs and avoiding disproportionately worsening any perspective's objectives.
The First Pass Response and Mediations have been provided as contextual inputs. Use them to inform your reasoning and incorporate them where they align with Pareto optimality.

## IMPORTANT:
- always fillow the output schema exactly using the markdown format provided. Your answer will be sent to a UI that relies on this format and if it's incorrect it will break the UI.

## Output Schema:
1. **Key Assumptions**: Provide the key assumptions that the response relies on.
2. **Response**: Provide a single, coherent response that reflects the Pareto Optimal integrated priorities of the perspectives.


# Inputs

## User Message (last message of the conversation below)
${userMessage}

## Perspectives
${perspectives.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## First Pass Response
${firstPassResponse}

## Mediations
${mediations}

  `;
};
