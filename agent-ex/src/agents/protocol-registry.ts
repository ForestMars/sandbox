/**
 * @file protocol-registry.ts
 * @description Central registry for agent protocols, defining skill paths, tools, and priorities.
 */
import { style } from '@/agents/style'; // Now in the right place
import { billingTools, resolutionTools, baseTools } from '@/tools';

export interface Protocol {
  skillPath: string;
  tools: any[]; // Use your Tool definition type here
  priority: number;
}

export const ProtocolRegistry: Record<string, Protocol> = {
  'resolution': {
    skillPath: 'skills/entity-resolution.md',
    tools: [...resolutionTools],
    priority: 100, // Conflict resolution always wins
  },
  'billing': {
    skillPath: 'skills/billing.md',
    tools: [...billingTools],
    priority: 50,
  },
  'default': {
    skillPath: 'skills/general-support.md',
    tools: [...baseTools],
    priority: 0,
  }
};