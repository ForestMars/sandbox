import { Agent } from '@mastra/core/agent';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: 'You are a support agent.',
  // This provider is specifically designed for AI SDK v5
  model: ollama('gemma3:latest'), 
  tools: {
    orderLookupTool,
  },
});