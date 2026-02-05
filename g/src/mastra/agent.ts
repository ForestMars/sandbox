import { Agent } from '@mastra/core';
import { orderLookupTool } from './tools';

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
