import { Agent } from '@mastra/core/agent';
import ollama from 'ollama'; // The official Ollama library
import { orderLookupTool } from '../tools/order-tools';

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: 'You are a support agent.',
  // We pass a simple model ID. Mastra will use its internal routing.
  model: {
    id: 'gemma3:latest',
    provider: 'OLLAMA',
  },
  tools: {
    orderLookupTool,
  },
});