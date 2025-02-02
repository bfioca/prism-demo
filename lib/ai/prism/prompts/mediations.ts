// This file contains the prompt for generating mediations between the perspectives.

export const multiPerspectiveMediationPrompt = (
  userMessage: string,
  perspectives: string[],
  firstPassResponse: string,
  conflicts: string[]
) => {
  return `
# Instructions
Develop mediations to address the conflicts identified below.
Focus on solutions that reduce the impact of these conflicts and improve alignment across perspectives, while avoiding disproportionately worsening any perspective's priorities.

# Output Schema:

The following is the output schema for the mediation prompt:

## Mediations:
   - Provide targeted refinements that address the conflicts holistically, aiming to reduce tradeoffs and improve alignment.
   - Focus on solutions that bridge tensions across perspectives.

# Inputs
The following are the inputs from which you can develop mediations.

# User Message (last message of the conversation below)
${userMessage}

# Perspectives
${perspectives.map((p, i) => `## Perspective ${i + 1}. ${p}`).join('\n')}

# First Pass Response
${firstPassResponse}

# Conflicts Identified
${conflicts.map((c, i) => `## Perspective ${i + 1}.\n${c}`).join('\n')}
  `;
};
