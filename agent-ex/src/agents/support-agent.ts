/**
 * @file support-agent.ts
 * @description Event-Sourced Graph-Based Support Agent.
 */

import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { entityLookupTool } from '@/tools/order-tools';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { rebuildGraph } from '@/lib/graph-reducer';
import type { AgentStep, AgentConfig, AgentSession, AgentEvent } from '@/types/agent-types';
import { resolveProtocol } from '@/lib/protocol-resolver';
import { CONTEXT_ANCHOR } from '@/agents/config';

// --- CONFIGURATION ---
const DEFAULT_MODEL = 'qwen2.5:7b';
const TEMPERATURE = 0; 

const __dirname = dirname(fileURLToPath(import.meta.url));
const instructions = readFileSync(join(__dirname, '..', '..', 'config', 'agent-instructions.txt'), 'utf-8');

const supportAgentConfig: AgentConfig = {
  name: 'SupportBot',
  model: process.env.SUPPORT_AGENT_MODEL || DEFAULT_MODEL,
  instructions,
  temperature: TEMPERATURE,
  tools: [entityLookupTool]
};

const toolCallSchema = z.object({
  tool: z.string().optional(),
  entityId: z.string().or(z.number()).transform(v => String(v))
});

/**
 * Generator-based support agent using Global Workspace Theory.
 */
export async function* supportAgent(
  userInput: string,
  session: AgentSession,
  opts?: { client?: any }
): AsyncGenerator<AgentStep, void, unknown> {

  const model = opts?.client || ollama(supportAgentConfig.model);
 
  // REDUCR: Build the World Model from the append-only log
  // This allows the agent to "remember" failures across devices.
  if (!session) throw new Error("No session provided to Agent.");
  if (!session.events) session.events = [];
  const worldModel = rebuildGraph(session.events);
  const graphContext = worldModel.serialize();
  console.log(`%c[DEBUG] Rebuilt World Model with ${JSON.stringify(graphContext)}`, 'color: cyan');

  // Use the central brain we built to decide how to act.
  // const { systemPrompt, tools, name } = resolveProtocol(worldModel.serialize(), session.activeDomain);
  const protocol = resolveProtocol(graphContext, session.activeDomain);

  console.log(`[ROUTER] Engaging ${protocol.name} protocol.`);

  // BROADCAST: Initialize and record the User Update to the Data Plane
  
  const userEvent: AgentEvent = { 
    type: 'USER_UPDATE', 
    payload: { text: userInput }, 
    timestamp: Date.now() 
  };
  session.events.push(userEvent);

  yield { 
    type: 'thinking', 
    timestamp: Date.now(), 
    message: 'Consulting internal knowledge graph...' 
  };

  console.log(`[DEBUG] Protocol System Prompt Length: ${protocol.systemPrompt?.length}`);
  console.log(`[DEBUG] Full System Prompt Sample: "${protocol.systemPrompt?.substring(0, 100)}..."`);

  // INFERENCE: Call LLM with instructions and the serialized Graph State

  


  const finalSystemPrompt = [
    instructions,
    protocol.systemPrompt,
    CONTEXT_ANCHOR,
    `### CURRENT KNOWLEDGE_GRAPH`, 
    graphContext, 
  ].filter(Boolean).join('\n\n');


  console.log(`[DEBUG] EVENT_LOG_LENGTH: ${session.events?.length}`);
  console.log(`[DEBUG] RECENT_EVENTS: ${JSON.stringify(session.events?.slice(-2))}`);
  console.log(`[DEBUG] GRAPH_CONTEXT_SENT: """\n${graphContext}\n"""`);

  const response = await generateText({
    model,
    // system: `${protocol.systemPrompt}\n\nCURRENT_KNOWLEDGE_GRAPH:\n${graphContext}`,
    system: [
      instructions,           // Constitution
      finalSystemPrompt,      // Resolver and Router logic
      graphContext            // The World Model (Knoledge Graph State)
    ].filter(Boolean).join('\n\n'),
    tools: protocol.tools, 
    prompt: userInput,
    temperature: supportAgentConfig.temperature
  });

  const text = response.text.trim();
  console.log(`\n[DEBUG] LLM Raw Output (Text Content): """\n${text}\n"""\n`);
  if (response.toolCalls.length > 0) {
    console.log(`\n[DEBUG] @@@@@@ Native Tool Calls Found:`, JSON.stringify(response.toolCalls, null, 2));
  }

  let toolCall = null;

  if (response.toolCalls && response.toolCalls.length > 0) {
      const call = response.toolCalls[0];

      const isLookup = call.toolName === 'entity-lookup' || call.toolName === '0';

      if (isLookup) {
    // Defensively find the arguments object
    // Checks .args (standard AI SDK) OR .input (seen in your logs)
    const args = (call.args || (call as any).input || {}) as any;

      toolCall = {
        tool: 'entity-lookup',
        // Gotta catch em all...
        entityId: String(
          args.entityId || 
          args.order_id || 
          args.order_number || 
          args.id || 
          "UNKNOWN"
        )
      }
    } 
  }
  // If you thought that last one was hacky...
  // REGEX FALLBACK (Only if native fails)
  if (!toolCall) {
    const text = response.text.trim();

    // Extract JSON tool calls from Control Plane intent
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const validated = toolCallSchema.safeParse(JSON.parse(jsonMatch[0]));
        if (validated.success) toolCall = validated.data;
      } catch (e) {}
    }
  }

  // EXECUTION & BROADCAST
  if (toolCall) {
    const { entityId } = toolCall;
    const toolId = toolCall.tool || 'entity-lookup';

    yield { type: 'tool_call', timestamp: Date.now(), toolId, parameters: { entityId } };

    // Execute the tool (The "Oracle" call)
    const result = await entityLookupTool.execute({ entityId });

    // BROADCAST tool result to data plane;
    // This is key to preventing the endeless loops on re-hydration.
    session.events.push({
      type: 'TOOL_RESULT',
      payload: { toolId, entityId, result },
      timestamp: Date.now()
    }); 

    yield { type: 'tool_result', timestamp: Date.now(), toolId, result };

    const updatedWorldModel = rebuildGraph(session.events);
    
    // Final Synthesis using the updated tool data
    const finalResponse = await generateText({
      model,
      system: protocol.systemPrompt,
      prompt: `User: ${userInput}\nTool Result: ${JSON.stringify(result)}\n\nSummarize for user:`,
      temperature: supportAgentConfig.temperature
    });

    console.log('[DEBUG] ToolCalls found:', response.toolCalls);
    console.log('[DEBUG] Raw Text found:', response.text);

    yield { type: 'final', timestamp: Date.now(), text: finalResponse.text };
  } else {
    yield { type: 'final', timestamp: Date.now(), text };
  }
}

export const supportAgentModelSpec = supportAgentConfig.model;