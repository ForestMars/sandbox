import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '@/tools/order-tools'; // Using your existing tool
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import type { AgentStep, AgentConfig } from '@/types/agent-types';

// --- HOISTED CONSTANTS ---
const DEFAULT_MODEL = 'qwen2.5:7b';
const TEMPERATURE = 0; 
const MAX_ITERATIONS = 5;

const __dirname = dirname(fileURLToPath(import.meta.url));
const instructionsPath = join(__dirname, '..', '..', 'config', 'agent-instructions.txt');
const instructions = readFileSync(instructionsPath, 'utf-8');

/**
 * Tool call schema for parsing LLM output
 */
const ToolCallSchema = z.object({
  tool: z.string(),
  orderId: z.string().optional(),
  parameters: z.record(z.any()).optional()
});

const supportAgentConfig: AgentConfig = {
  name: 'SupportBot',
  model: process.env.SUPPORT_AGENT_MODEL || DEFAULT_MODEL,
  instructions,
  temperature: TEMPERATURE,
  tools: [orderLookupTool]
};

export async function* supportAgent(
  userInput: string,
  opts?: { client?: unknown }
): AsyncGenerator<AgentStep, void, unknown> {
  
  const model = opts?.client || ollama(supportAgentConfig.model);
  let conversationHistory = `User: ${userInput}`;
  let isComplete = false;
  let iterations = 0;

  while (!isComplete && iterations < MAX_ITERATIONS) {
    iterations++;

    yield { 
      type: 'thinking', 
      timestamp: Date.now(), 
      message: iterations > 1 ? 'Synthesizing answer...' : 'Processing request...' 
    };

    const response = await generateText({
      model,
      system: supportAgentConfig.instructions,
      prompt: conversationHistory,
      temperature: supportAgentConfig.temperature,
    });

    const text = response.text.trim();
    const cleanJson = text.replace(/```json|```/g, '').trim();

    try {
      // Attempt to parse tool call
      const parsed = JSON.parse(cleanJson);
      const validated = ToolCallSchema.safeParse(parsed);
      
      if (validated.success && validated.data.tool) {
        const toolId = validated.data.tool;
        const tool = supportAgentConfig.tools.find(t => t.id === toolId);
        
        if (tool) {
          const params = validated.data.parameters || { orderId: validated.data.orderId };
          
          yield { type: 'tool_call', timestamp: Date.now(), toolId: tool.id, parameters: params };

          const result = await tool.execute(params);
          
          yield { type: 'tool_result', timestamp: Date.now(), toolId: tool.id, result };

          // Update history for the next loop iteration
          conversationHistory += `\nAssistant (Tool Call): ${text}\nTool Result: ${JSON.stringify(result)}\nInstructions: Use this data to provide a final answer to the user.`;
        } else {
          conversationHistory += `\nAssistant: Error: Tool ${toolId} not found.`;
        }
      } else {
        // Valid JSON but not a tool call? Treat as final.
        yield { type: 'final', timestamp: Date.now(), text };
        isComplete = true;
      }
    } catch (e) {
      // Not JSON? It's a plain text response.
      yield { type: 'final', timestamp: Date.now(), text };
      isComplete = true;
    }
  }

  if (iterations >= MAX_ITERATIONS && !isComplete) {
    yield { type: 'final', timestamp: Date.now(), text: "I'm sorry, I reached my reasoning limit." };
  }
}

export const supportAgentModelSpec = supportAgentConfig.model;