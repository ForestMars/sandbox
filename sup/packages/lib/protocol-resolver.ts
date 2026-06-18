/**
 * @file protocol-resolver.ts
 * @description Centralized Protocol Resolver for Dynamic Capability Discovery.
 * Determines which operational protocol (skill + toolset) to engage based on the current graph context and active domain.
 * This is the 🧠 of the agent's capability discovery mechanism, enabling it to adapt its behavior dynamically.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { entityLookupTool, resolutionTools } from '@/tools/order-tools';
import { style } from '@/agents/style/';
import { logger } from '../infra/logger';
import { Protocol } from '@/domain/expertise.types';
import type { ExpertStrategy, ExpertiseResolverPort } from '@/domain/expertise.types';

// 1. PATH CONFIGURATION
// Ensure this matches your actual project structure (e.g., /src/agents/skills)
const SKILLS_DIR = join(process.cwd(), 'src', 'agents', 'skills');

// 2. THE REGISTRY STRUCT
export const Registry: Record<string, Protocol> = {
  resolution: {
    key: 'resolution',
    name: 'Conflict Resolution',
    skillPath: 'entity-resolution.md',
    tools: [entityLookupTool, ...resolutionTools],
    styleOverride: "URGENT: Prioritize resolving data conflicts before answering general questions."
  },
  billing: {
    key: 'billing',
    name: 'Billing Domain',
    skillPath: 'billing.md',
    tools: [entityLookupTool],
  },
  default: {
    key: 'default',
    name: 'General Support',
    skillPath: '', 
    tools: [entityLookupTool]
  }
};

/**
 * resolveProtocol
 * Core 🧠 for Capability Discovery.
 */
// Implement the ExpertiseResolverPort so this module can be injected
export const ProtocolResolver: ExpertiseResolverPort = {
  resolve(graphContext: string): ExpertStrategy {
    // Logic Plane: Determine which protocol to engage
    let selection = Registry.default;

    if (graphContext.includes('UNRESOLVED_CONFLICT')) {
      selection = Registry.resolution;
    }

    // Implementation Plane: Load the actual markdown content lazily
    let skillContent = "";
    if (selection.skillPath && selection.skillPath.trim() !== "") {
      try {
        const fullPath = join(SKILLS_DIR, selection.skillPath);
        skillContent = readFileSync(fullPath, 'utf-8');
      } catch (error) {
        logger.error(`[PROTOCOL_ERROR] Failed to load skill at ${selection.skillPath}:`, error);
      }
    }

    const systemPrompt = [
      style,
      selection.styleOverride || "",
      skillContent ? "## OPERATIONAL PROTOCOL" : "",
      skillContent
    ].filter(Boolean).join('\n\n');

    return {
      key: selection.key || 'default',
      skillPath: selection.skillPath,
      tools: selection.tools,
      rules: selection.styleOverride || "",
      systemPrompt,
      name: selection.name
    };
  }
};

// Backwards-compatible helper
export function resolveProtocol(graphContext: string) {
  return ProtocolResolver.resolve(graphContext);
}