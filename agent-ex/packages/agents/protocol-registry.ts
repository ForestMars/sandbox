/**
 * @file protocol-registry.ts
 * @description Central registry for agent protocols, defining skill paths, tools, and priorities.
 */
import { style } from './style'; // Now in the right place
import { billingTools, resolutionTools, baseTools } from '@/tools';
import { Protocol } from '@/domain/expertise.types';

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