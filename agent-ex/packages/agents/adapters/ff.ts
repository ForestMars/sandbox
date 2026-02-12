/**
 * @file /src/agents/adapters/ff.ts
 * @description Adapter to wrap core support agent with feature flag logic.
 */
import type { AgentSession, AgentStep } from '@/types/agent-types';
import { supportAgent } from '@/agents/support-agent';
import { formatToolResult } from '@/lib/tool-formatter';
import { featureFlags } from '@/lib/feature-flags';
import { ProtocolResolver } from '@/lib/protocol-resolver';
import { adapters } from '@/tools';

export async function* flaggedSupportAgent(
  userInput: string,
  session: AgentSession,
  opts?: { client?: any; userId?: string }
): AsyncGenerator<AgentStep, void, unknown> {
  
  const userId = opts?.userId || session.userId;
  
  const flags = {
    routing: await featureFlags.isEnabled('advanced_routing', userId),
    style: await featureFlags.isEnabled('styled_formatting', userId),
    web: await featureFlags.isEnabled('web_search', userId),
  };
  
  const agentOpts = {
    ...opts,
    resolver: ProtocolResolver,
    tools: adapters,
    formatter: flags.style 
      ? formatToolResult
      : (s, t, r, i) => JSON.stringify(r),
    enableWebSearch: flags.web,
    useAdvancedRouter: flags.routing,
  };
  
  yield* supportAgent(userInput, session, agentOpts);
}