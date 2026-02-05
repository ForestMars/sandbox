import { Mastra } from '@mastra/core';
import { supportAgent } from './agents/support-agent';

// Ensure you are exporting a CONST named 'mastra'
export const mastra = new Mastra({
  agents: { supportAgent },
});