import { Mastra } from '@mastra/core';
import { supportAgent } from './agents/support-agent.js';

export const mastra = new Mastra({
  agents: { supportAgent },
});
