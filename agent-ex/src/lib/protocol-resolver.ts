/**
 * @file protocol-registry.ts
 * @description Central registry for agent protocols and skills.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { style } from '@/agents/prompts/style'; 
import { entityLookupTool, resolutionTools } from '@/tools/order-tools';

export interface Protocol {
  name: string;
  skill: string;
  tools: any[];
}

export const Registry: Record<string, Protocol> = {
  resolution: {
    name: 'Conflict Resolution',
    skill: readFileSync(join(process.cwd(), 'agents/skills/entity-resolution.md'), 'utf-8'),
    tools: [entityLookupTool, ...resolutionTools]
  },
  billing: {
    name: 'Billing Domain',
    skill: readFileSync(join(process.cwd(), 'agents/skills/billing.md'), 'utf-8'),
    tools: [entityLookupTool]
  }
};

/**
 * Protocol Resolver - Determines which operator persona the agent should use,
 *  based on the current state of the world model (knowledge graph) and active domain
 */
export function resolveProtocol(graphContext: string, activeDomain?: string): Protocol {
  if (graphContext.includes('UNRESOLVED_CONFLICT')) {
    return Registry.resolution;
  }
  return Registry[activeDomain || 'billing'] || Registry.billing;
}