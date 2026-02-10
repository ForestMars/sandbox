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

async function loadSkill(fileName: string): Promise<string> {
  try {
    // Use the __dirname we already have to build an absolute path
    const skillPath = join(__dirname, 'skills', fileName);
    const content = readFileSync(skillPath, 'utf-8');
    console.log(`[DEBUG] Successfully loaded skill: ${fileName}`);
    return content;
  } catch (error) {
    console.error(`[ERROR] Failed to load skill at ${join(__dirname, 'skills', fileName)}`);
    return ""; 
  }
}

/**
 * Generator-based support agent using Global Workspace Theory.
 */
export async function* supportAgent(
  userInput: string,
  session: AgentSession,
  opts?: { client?: any }
): AsyncGenerator<AgentStep, void, unknown> {

  const model = opts?.client || ollama(supportAgentConfig.model);
 
  // @TODO Prompt assembly should be moved into its own function. 
  // Load Constitution (rebuilds world model from event log.)
  const coreInstructions = instructions
  
  // REDUCR: Build the World Model from the append-only log
  // This allows the agent to "remember" failures across devices.
  const worldModel = rebuildGraph(session.events);
  const { skill, tools, name } = resolveProtocol(worldModel.serialize(), session.activeDomain);
  console.log(`[ROUTER] Engaging ${name} protocol.`);

  // Capability Discovery - Dynamic capabilities can be thought of as decorators on the HOF which provides control plane policy. 
  // NB. we don't get this from session.activeDomain bc we want to be able to load the entity-resolution skill even if the active domain is something else. 
  // This allows the agent to acquire new capabilities on the fly based on the current state of the world model, rather than being limited to a single domain's skill set.
  // const activeSkillContent = session.activeDomain 
  const graphContext = worldModel.serialize();
  let domainSkill = "";
  if (graphContext.includes('UNRESOLVED_CONFLICT')) {
    domainSkill = await loadSkill('entity-resolution.md');
  } else if (session.activeDomain) {
    domainSkill = await loadSkill(`${session.activeDomain}.md`);
  }
  const dynamicSystemPrompt = [
    supportAgentConfig.instructions, // Layer 1: Core Constitution
    graphContext,                    // Layer 2: State (Knowledge Graph)
    domainSkill                      // Layer 3: Dynamic Skill (e.g. Entity Resolution))
    ].join('\n\n');

  // BROADCAST: Initialize and record the User Update to the Data Plane
  if (!session) throw new Error("No session provided to Agent.");
  if (!session.events) session.events = [];

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

  let specializedSkills = "";
  if (worldModel.serialize().includes('UNRESOLVED_CONFLICT')) {
    specializedSkills = await loadSkill('entity-resolution.md');
  }

  // INFERENCE: Call LLM with instructions and the serialized Graph State
  const response = await generateText({
    model,
    // system: `${supportAgentConfig.instructions}\n\nCURRENT_KNOWLEDGE_GRAPH:\n${graphContext}`,
    system: `${style}\n\n${skill}\n\n${worldModel.serialize()}`,
    tools: tools, 
    prompt: userInput,
    temperature: supportAgentConfig.temperature
  });

  const text = response.text.trim();
  console.log(`\n[DEBUG] LLM Raw Output: """\n${text}\n"""\n`);

  let toolCall = null;

  // Extract JSON tool calls from Control Plane intent
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = toolCallSchema.safeParse(parsed);
      if (validated.success) toolCall = validated.data;
    } catch (e) { /* Fallback to conversational */ }
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
