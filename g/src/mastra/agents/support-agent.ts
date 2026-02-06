import { Agent } from '@mastra/core/agent';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { readFileSync } from 'fs';
import { join } from 'path';

const active_model = 'qwen2.5:7b'
const instructions = readFileSync(join(process.cwd(), 'config', 'agent-instructions.txt'), 'utf-8');

export const supportAgentModelSpec = process.env.SUPPORT_AGENT_MODEL || active_model;

export const supportAgent = new Agent({
  name: 'SupportBot',
  instructions: instructions,
  model: ollama(supportAgentModelSpec),
  tools: {
    orderLookupTool,
  },
  // Force the agent to continue after tool execution
  experimental_continueSteps: true,
});