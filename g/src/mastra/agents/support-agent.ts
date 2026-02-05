import { Agent } from '@mastra/core/agent';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: 'You are a support agent. You have access to an orderLookupTool. If a user asks about an order or provides an order ID, you MUST use the orderLookupTool immediately to get the facts before respondinng', 
  // This provider is specifically designed for AI SDK v5
  // model: ollama('orieg/gemma3-tools:4b-it-qat'), 
  model: ollama('qwen2.5-coder:1.5b'),
  tools: {
    orderLookupTool,
  },
});