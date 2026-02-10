export type Style = 'friendly' | 'formal' | 'raw' | 'none';

export type ToolMeta = {
  id: string;
  description?: string;
  // future fields: type, schema, examples
};

function humanizeToolId(id: string) {
  return id.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim();
}

function summarizeResult(toolResult: any) {
  if (toolResult == null) return 'No result.';
  if (typeof toolResult === 'string') return toolResult;
  if (typeof toolResult === 'object') {
    // Common pattern: status + deliveryDate
    if ('status' in toolResult) {
      const status = toolResult.status;
      const when = toolResult.deliveryDate ? ` (delivery: ${toolResult.deliveryDate})` : '';
      return `${status}${when}`;
    }
    // If it's a simple map with few keys, make a concise summary
    const keys = Object.keys(toolResult);
    if (keys.length <= 3) {
      return keys.map(k => `${k}: ${JSON.stringify(toolResult[k])}`).join(', ');
    }
    // Fallback to JSON
    try {
      return JSON.stringify(toolResult);
    } catch (e) {
      return String(toolResult);
    }
  }
  return String(toolResult);
}

export function formatToolResult(style: Style, tool: ToolMeta, toolResult: any, userInput?: string) {
  const humanTool = humanizeToolId(tool.id || tool.description || 'tool');

  // Raw style returns JSON/stringified payload
  if (style === 'raw' || style === 'none') {
    try {
      return typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
    } catch (e) {
      return String(toolResult);
    }
  }

  const summary = summarizeResult(toolResult);

  if (style === 'friendly') {
    return `I have your answer. The ${humanTool}${userInput ? ` (${userInput})` : ''} shows: ${summary}`;
  }

  if (style === 'formal') {
    return `Result for ${humanTool}: ${summary}`;
  }

  // Default fallback
  return summary;
}

export default { formatToolResult };
