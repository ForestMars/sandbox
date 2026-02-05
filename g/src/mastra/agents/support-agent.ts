import { Agent } from '@mastra/core/agent';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { readFileSync } from 'fs';
import { join } from 'path';

const instructions = readFileSync(join(process.cwd(), 'config', 'agent-instructions.txt'), 'utf-8');

// Allow overriding the model spec via environment variable, otherwise use the configured default.
export const supportAgentModelSpec = process.env.SUPPORT_AGENT_MODEL || 'qwen2.5-coder:1.5b';

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: instructions,
  model: ollama(supportAgentModelSpec),
  tools: {
    orderLookupTool,
  },
});