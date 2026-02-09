/**
 * @file support-agent.ts
 * @description Event-Sourced Graph-Based Support Agent.
 */

import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '@/tools/order-tools';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { rebuildGraph } from '@/lib/graph-reducer';
import type { AgentStep, AgentConfig, AgentSession, AgentEvent } from '@/types/agent-types';

// --- CONFIGURATION ---
const DEFAULT_MODEL = 'qwen2.5:7b';
const TEMPERATURE = 0; 

const __dirname = dirname(fileURLToPath(import.meta.url));
const instructions = readFileSync(join(__dirname, '..', '..', 'config', 'agent-instructions.txt'), 'utf-8');

const ToolCallSchema = z.object({
  tool: z.string().optional(),
  orderId: z.string().or(z.number()).transform(v => String(v))
});

const supportAgentConfig: AgentConfig = {
  name: 'SupportBot',
  model: process.env.SUPPORT_AGENT_MODEL || DEFAULT_MODEL,
  instructions,
  temperature: TEMPERATURE,
  tools: [orderLookupTool]
};

/**
 * Generator-based support agent using Global Workspace Theory.
 */
export async function* supportAgent(
  userInput: string,
  session: AgentSession,
  opts?: { client?: any }
): AsyncGenerator<AgentStep, void, unknown> {

  const model = opts?.client || ollama(supportAgentConfig.model);

  // 1. BROADCAST: Initialize and record the User Update to the Data Plane
  if (!session) throw new Error("No session provided to Agent.");
  if (!session.events) session.events = [];

  const userEvent: AgentEvent = { 
    type: 'USER_UPDATE', 
    payload: { text: userInput }, 
    timestamp: Date.now() 
  };
  session.events.push(userEvent);

  // 2. REDUCE: Build the World Model from the append-only log
  // This allows the agent to "remember" failures across devices.
  const worldModel = rebuildGraph(session.events);

  // 3. CONTEXT: Serialize the Knowledge Graph for the LLM
  const graphContext = worldModel.serialize();

  yield { 
    type: 'thinking', 
    timestamp: Date.now(), 
    message: 'Consulting internal knowledge graph...' 
  };

  // 4. INFERENCE: Call LLM with instructions and the serialized Graph State
  const response = await generateText({
    model,
    system: `${supportAgentConfig.instructions}\n\nCURRENT_KNOWLEDGE_GRAPH:\n${graphContext}`,
    prompt: userInput,
    temperature: supportAgentConfig.temperature
  });

  const text = response.text.trim();
  console.log(`\n[DEBUG] LLM Raw Output: """\n${text}\n"""\n`);

  let toolCall = null;

  // Extract JSON tool calls (The "Control Plane" intent)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = ToolCallSchema.safeParse(parsed);
      if (validated.success) toolCall = validated.data;
    } catch (e) { /* Fallback to conversational */ }
  }

  // 5. EXECUTION & BROADCAST
  if (toolCall) {
    const { orderId } = toolCall;
    const toolId = toolCall.tool || 'order-lookup';
    
    yield { type: 'tool_call', timestamp: Date.now(), toolId, parameters: { orderId } };

    // Execute the tool (The "Oracle" call)
    const result = await orderLookupTool.execute({ orderId });
    
    // BROADCAST the tool result back to the session log
    // This is the key to preventing the 999 loop on re-hydration!
    session.events.push({
      type: 'TOOL_RESULT',
      payload: { toolId, orderId, result },
      timestamp: Date.now()
    });

    yield { type: 'tool_result', timestamp: Date.now(), toolId, result };

    const updatedWorldModel = rebuildGraph(session.events);
    // Final Synthesis using the updated tool data
    const finalResponse = await generateText({
      model,
      // system: supportAgentConfig.instructions,
      system: `${supportAgentConfig.instructions}\n\n${worldModel.serialize()}`,
      prompt: `User: ${userInput}\nTool Result: ${JSON.stringify(result)}\n\nSummarize for user:`,
      temperature: supportAgentConfig.temperature
    });

    yield { type: 'final', timestamp: Date.now(), text: finalResponse.text };
  } else {
    yield { type: 'final', timestamp: Date.now(), text };
  }
}

export const supportAgentModelSpec = supportAgentConfig.model;