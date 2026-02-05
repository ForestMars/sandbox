import { Agent } from '@mastra/core/agent';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { readFileSync } from 'fs';
import { join } from 'path';

const instructions = readFileSync(join(process.cwd(), 'config', 'agent-instructions.txt'), 'utf-8');

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: instructions,
  // model: ollama('orieg/gemma3-tools:4b-it-qat'), 
  model: ollama('qwen2.5-coder:1.5b'),
  tools: {
    orderLookupTool,
  },
});