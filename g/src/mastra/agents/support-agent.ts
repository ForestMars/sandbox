import { Agent } from '@mastra/core/agent';
import { ollama } from 'ollama-ai-provider';
import { orderLookupTool } from '../tools/order-tools';

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: 'You are a support agent. Use orderLookupTool for order queries.',
  model: ollama('gemma3'), 
  tools: {
    orderLookupTool,
  },
});