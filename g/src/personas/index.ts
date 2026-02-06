export type Persona = 'friendly' | 'formal' | 'raw' | 'none';

function humanizeToolId(id: string) {
  return id.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim();
}

export function formatToolResult(persona: Persona, toolId: string, toolResult: any, userInput?: string) {
  const humanTool = humanizeToolId(toolId);

  // Raw persona returns JSON/stringified payload
  if (persona === 'raw' || persona === 'none') {
    try {
      return typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
    } catch (e) {
      return String(toolResult);
    }
  }

  // Friendly persona — conversational
  if (persona === 'friendly') {
    if (toolResult && toolResult.status) {
      const when = toolResult.deliveryDate ? ` It was ${toolResult.deliveryDate}.` : '';
      return `I have your answer. The ${humanTool} you asked about${userInput ? ` (${userInput})` : ''} shows: ${toolResult.status}.${when}`;
    }
    return `I have your answer — here it is: ${typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)}`;
  }

  // Formal persona — concise, slightly more formal
  if (persona === 'formal') {
    if (toolResult && toolResult.status) {
      const when = toolResult.deliveryDate ? ` Delivery date: ${toolResult.deliveryDate}.` : '';
      return `Result for ${humanTool}: ${toolResult.status}.${when}`;
    }
    return `Result: ${typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)}`;
  }

  // Default fallback
  try {
    return typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
  } catch (e) {
    return String(toolResult);
  }
}

export default { formatToolResult };
