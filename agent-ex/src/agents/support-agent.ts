/**
 * @file support-agent.ts
 * @description Core generator-based agent for corporate support. 
 * Handles natural language intent, tool orchestration, and synthesis.
 * @module agents/support-agent
 */

import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '@/tools/order-tools';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import type { AgentStep, AgentConfig } from '@/types/agent-types';

// --- CONFIGURATION ---
const DEFAULT_MODEL = 'qwen2.5:7b';
const TEMPERATURE = 0; 

const __dirname = dirname(fileURLToPath(import.meta.url));
const instructions = readFileSync(join(__dirname, '..', '..', 'config', 'agent-instructions.txt'), 'utf-8');

/**
 * Validates the expected tool call format from the LLM
 */
const ToolCallSchema = z.object({
  tool: z.string(),
  orderId: z.string()
});

/**
 * Support agent configuration object
 */
const supportAgentConfig: AgentConfig = {
  name: 'SupportBot',
  model: process.env.SUPPORT_AGENT_MODEL || DEFAULT_MODEL,
  instructions,
  temperature: TEMPERATURE,
  tools: [orderLookupTool]
};

/**
 * Generator-based support agent.
 * @param {string} userInput - The raw message from the user.
 * @param {Object} [opts] - Optional client overrides for testing.
 * @yields {AgentStep} Current execution state.
 */
export async function* supportAgent(
  userInput: string,
  opts?: { client?: unknown }
): AsyncGenerator<AgentStep, void, unknown> {
  
  const model = opts?.client || ollama(supportAgentConfig.model);

  yield { 
    type: 'thinking', 
    timestamp: Date.now(), 
    message: 'Analyzing request...' 
  };

  const firstResponse = await generateText({
    model,
    system: supportAgentConfig.instructions,
    prompt: userInput,
    temperature: supportAgentConfig.temperature
  });

  const text = firstResponse.text.trim();
  let toolCall = null;

  // Regex to extract JSON block from potentially conversational LLM output
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool || parsed.orderId) {
        toolCall = parsed;
      }
    } catch (e) {
      // JSON parse failed, treat as conversational
    }
  }

  if (toolCall) {
    const orderId = String(toolCall.orderId || "unknown");
    const toolId = toolCall.tool || 'invoice-status';
    
    yield { 
      type: 'tool_call', 
      timestamp: Date.now(), 
      toolId, 
      parameters: { orderId } 
    };

    const result = await orderLookupTool.execute({ orderId });
    
    yield { 
      type: 'tool_result', 
      timestamp: Date.now(), 
      toolId, 
      result 
    };

    yield { 
      type: 'thinking', 
      timestamp: Date.now(), 
      message: 'Synthesizing response...' 
    };

    const finalResponse = await generateText({
      model,
      system: supportAgentConfig.instructions,
      prompt: `User: ${userInput}\nData: ${JSON.stringify(result)}\n\nSummarize:`,
      temperature: supportAgentConfig.temperature
    });

    yield { 
      type: 'final', 
      timestamp: Date.now(), 
      text: finalResponse.text 
    };
  } else {
    yield { 
      type: 'final', 
      timestamp: Date.now(), 
      text 
    };
  }
}

// Ensure this matches the import in chat.ts exactly
export const supportAgentModelSpec = supportAgentConfig.model;