import { Agent } from '@mastra/core/agent';
import { ollama } from 'ollama-ai-provider';
import { orderLookupTool } from '../tools/order-tools';

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: 'You are a helpful support agent. Use tools to verify info.',
  model: {
    provider: 'OLLAMA',
    name: 'gemma3',
    config: {
      endpoint: 'http://localhost:11434', // Default Ollama port
    }
  },
  tools: {
    orderLookupTool,
  },
});
