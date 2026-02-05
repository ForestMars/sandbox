import { Mastra } from '@mastra/core';
import { supportAgent } from './agents/support-agent.js';

// Ensure you are exporting a CONST named 'mastra'
export const mastra = new Mastra({
  agents: { supportAgent },
});