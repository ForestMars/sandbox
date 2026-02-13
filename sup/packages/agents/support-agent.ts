/**
 * @file /src/agents/support-agent.ts
 * @description Event-Sourced Graph-Based Support Agent.
 */
import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';

//import type { AgentStep, AgentConfig, AgentSession, AgentEvent } from '@types/agent-types';
import type { ExpertiseResolverPort, ToolAdapterPort } from '@domain/expertise.types';
import { rebuildGraph } from '@lib/graph-reducer';
import { logger } from '@infra/logger';
import { CONTEXT_ANCHOR } from '@agents/config';
import { OutputPort } from '@domain';


const DEFAULT_MODEL = 'qwen2.5:7b'; // AGENT_MODEL
const FACTUTUM_MODEL = 'qwen2.5:1.5b'; // Helper model for tool calls and retrieval-augmented steps. 
const TEMPERATURE = 0; 

const __dirname = dirname(fileURLToPath(import.meta.url));
const instructions = readFileSync(join(__dirname, '..', '..', 'config', 'agent-instructions.txt'), 'utf-8');

const supportAgentConfig: AgentConfig = {
  name: 'SupportBot',
  model: process.env.SUPPORT_AGENT_MODEL || DEFAULT_MODEL,
  instructions,
  temperature: TEMPERATURE,
  tools: []
};

const toolCallSchema = z.object({
  tool: z.string(),
  entityId: z.string().or(z.number()).transform(v => String(v))
});

/**
 * (PROJECTION) Reconstruct a human-readable conversation history from the event log.
 * This is what gives the LLM a coherent "memory" of the conversation —
 * structured graph state alone is not enough for the model to resolve
 * pronoun/entity references across turns.
 */
function buildConversationHistory(events: AgentEvent[]): string {
  return events
    .filter(e => e.type === 'USER_UPDATE' || e.type === 'TOOL_RESULT')
    .map(e => {
      if (e.type === 'USER_UPDATE') {
        return `User: ${e.payload.text}`;
      }
      if (e.type === 'TOOL_RESULT') {
        return `System: Retrieved entity ${e.payload.entityId} → ${JSON.stringify(e.payload.result)}`;
      }
      return null;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Generator-based support agent using Global Workspace Theory.
 */
export async function* supportAgent(
  userInput: string,
  session: AgentSession,
  opts?: {  
    // output: OutputPort; 
    client?: LanguageModel; // AI SDK type, can be a mock for testing.  
    resolver?: ExpertiseResolverPort; 
    tools?: Record<string, ToolAdapterPort> 
    }
): AsyncGenerator<AgentStep, void, unknown> {

  if (!session) throw new Error("No session provided to Agent.");
  if (!session.events) session.events = [];

  const model = opts?.client || ollama(supportAgentConfig.model);

  /** BROADCAST: Initialize and record the User Update to the Data Plane.
   * NOTE: We push to the event log BEFORE calling rebuildGraph so that
   * the current user message is visible to the router and world model.
   */
  const userEvent: AgentEvent = { 
    type: 'USER_UPDATE', 
    payload: { text: userInput }, 
    timestamp: Date.now() 
  };
  session.events.push(userEvent);

  /** REDUCR: Build the World Model from the append-only log.
   * This allows the agent to "remember" failures across devices.
   */
  const worldModel = rebuildGraph(session.events);
  const graphContext = worldModel.serialize();

  // Use the central brain we built to decide how to act.
  const protocol = opts?.resolver?.resolve(graphContext) ?? { key: 'default', name: 'General Support', skillPath: '', tools: [], systemPrompt: '' };

  logger.info(`[ROUTER] Engaging ${protocol.name} protocol.`);

  yield { 
    type: 'thinking', 
    timestamp: Date.now(), 
    message: 'Consulting internal knowledge graph...' 
  };

  logger.debug(`[DEBUG] Protocol System Prompt Length: ${protocol.systemPrompt?.length}`);
  logger.debug(`[DEBUG] Full System Prompt Sample: "${protocol.systemPrompt?.substring(0, 100)}..."`);
  logger.debug(`[DEBUG] EVENT_LOG_LENGTH: ${session.events.length}`);
  logger.debug(`[DEBUG] RECENT_EVENTS: ${JSON.stringify(session.events.slice(-2))}`);
  logger.debug(`[DEBUG] GRAPH_CONTEXT_SENT: """\n${graphContext}\n"""`);

  /** NFERENCE: Call LLM with instructions and the serialized Graph State.
   * Prompt ordering matters for small models — place behavioral instructions
   * before the data they govern, and gate the graph with an explicit instruction
   * so the model treats it as authoritative memory, not just metadata.
   * If you're metaphorically inclined, it maps to past present future. 
   */
    const systemPrompt = [
    instructions,           // Constitution — who you are, non-negotiables
    protocol.systemPrompt,  // What to do RIGHT NOW — close to the data it governs
    CONTEXT_ANCHOR,         // How to interpret what follows
    `### CURRENT KNOWLEDGE_GRAPH\n` +
    `The following represents your memory of this conversation. ` +
    `All entity IDs and states here are established facts — ` +
    `do NOT ask the user to re-provide information already present here.\n`,
    graphContext,           // The World Model — last thing read, most salient
  ].filter(Boolean).join('\n\n');

  // Include reconstructed conversation history in the prompt so the model
  // can resolve cross-turn references (e.g. "it" → order #999).
  // Without this, the model has no conversational grounding — structured
  // graph state alone is not sufficient for pronoun/entity resolution.
  const conversationHistory = buildConversationHistory(session.events);
  const fullPrompt = conversationHistory
    ? `${conversationHistory}\nUser: ${userInput}`
    : userInput;

 /**
 * Executes generative request and logs precise inference metrics.
 * * @async
 * @name executeInference
 * @param {string} systemPrompt - The system-level instructions.
 * @param {string} fullPrompt - The user-provided prompt.
 * @returns {Promise<Object>} The response from the generative model.
 * * @note Token counts are calculated using a characters-to-tokens heuristic (1 token ≈ 4 chars).
 * @see {@link logger} for 'inference_complete' event structure.
 */
  const prompt = systemPrompt + '\n\n' + fullPrompt;
  const inputTokens = Math.ceil(prompt.length / 4);
  const startTime = performance.now();

  const response = await generateText({
    model,
    system: systemPrompt,
    tools: protocol.tools, 
    prompt: fullPrompt,
    temperature: supportAgentConfig.temperature
  });

  const inferenceLatencyMs = Math.round(performance.now() - startTime);
  const outputTokens = response.text ? Math.ceil(response.text.length / 4) : 0;

  const text = response.text.trim();
  logger.debug(`\n[DEBUG] LLM Raw Output (Text Content): """\n${text}\n"""\n`);
  if (response.toolCalls.length > 0) {
    logger.debug(`\n[DEBUG] @@@@@@ Native Tool Calls Found:`, JSON.stringify(response.toolCalls, null, 2));
  }

   logger.info({
    // cacheHit: false,
    inputTokens,          
    outputTokens,
    latencyMs: inferenceLatencyMs,  // Acktual wall time
    model: supportAgentConfig.model,
    temperature: supportAgentConfig.temperature,
    toolCalls: response.toolCalls?.length || 0
  }, 'inference_complete');

  // TOOL CALL EXTRACTION
  // Priority 1: Native tool calls from the AI SDK
  let toolCall: { tool: string; entityId: string } | null = null;

  if (response.toolCalls && response.toolCalls.length > 0) {
    const call = response.toolCalls[0];

    // toolName === '0' is a known provider variant — see issue tracker
    const isLookup = call.toolName === 'entity-lookup' || call.toolName === '0';

    if (isLookup) {
      // Defensively find the arguments object.
      // Checks .args (standard AI SDK) OR .input (seen in some provider variants)
      const args = (call.args || (call as any).input || {}) as any;
      const rawId = args.entityId || args.order_id || args.order_number || args.id;

      if (rawId !== undefined) {
        toolCall = {
          tool: 'entity-lookup',
          entityId: String(rawId)
        };
      }
    } 
  }

  // Priority 2: JSON embedded in text output
  // REGEX FALLBACK — only if native extraction failed
  if (!toolCall && text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const validated = toolCallSchema.safeParse(JSON.parse(jsonMatch[0]));
        if (validated.success) toolCall = validated.data;
      } catch (e) { /* Fallback to conversational */ }
    }
  }

  // EXECUTION & BROADCAST
  if (toolCall) {
    const { entityId } = toolCall;
    const toolId = toolCall.tool;

    yield { type: 'tool_call', timestamp: Date.now(), toolId, parameters: { entityId } };

    // Execute the tool via injected tool adapters
    const toolAdapter = opts?.tools?.[toolId];
    if (!toolAdapter) {
      throw new Error(`No tool adapter provided for ${toolId}`);
    }
    const result = await (toolAdapter as any).execute?.({ entityId });

    // BROADCAST tool result to data plane.
    // This is key to preventing endless loops on re-hydration.
    session.events.push({
      type: 'TOOL_RESULT',
      payload: { toolId, entityId, result },
      timestamp: Date.now()
    }); 

    yield { type: 'tool_result', timestamp: Date.now(), toolId, result };

    // Rebuild with the tool result now included so the final synthesis
    // prompt reflects the fully updated world state.
    const updatedGraphContext = rebuildGraph(session.events).serialize();
    const historyWithResult = buildConversationHistory(session.events);

    // Final Synthesis using the updated tool data
    const finalResponse = await generateText({
      model,
      system: [
        protocol.systemPrompt,
        `### CURRENT KNOWLEDGE_GRAPH\n` +
        `Do NOT ask the user for information already present here.\n` +
        updatedGraphContext,
      ].filter(Boolean).join('\n\n'),
      prompt: `${historyWithResult}\n\nBased on the above, summarize the situation for the user.`,
      temperature: supportAgentConfig.temperature
    });

    logger.debug('[DEBUG] ToolCalls found:', response.toolCalls);
    logger.debug('[DEBUG] Raw Text found:', response.text);

    yield { type: 'final', timestamp: Date.now(), text: finalResponse.text };
  } else {
    yield { type: 'final', timestamp: Date.now(), text };
  }
}

export const supportAgentModelSpec = supportAgentConfig.model;