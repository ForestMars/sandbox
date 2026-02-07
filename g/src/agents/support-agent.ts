// src/agents/support-agent.ts

import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import type { 
  AgentStep, 
  AgentConfig,
  Tool 
} from '../types/agent-types';

const active_model = 'qwen2.5:7b';
const instructions = readFileSync(
  join(process.cwd(), 'config', 'agent-instructions.txt'),
  'utf-8'
);

/**
 * LLM response structure
 */
interface LLMResponse {
  text: string;
}

/**
 * Tool call request from LLM
 */
const ToolCallRequestSchema = z.object({
  tool: z.string(),
  orderId: z.string()
});

type ToolCallRequest = z.infer<typeof ToolCallRequestSchema>;

/**
 * Support agent configuration
 */
const supportAgentConfig: AgentConfig = {
  name: 'SupportBot',
  model: process.env.SUPPORT_AGENT_MODEL || active_model,
  instructions,
  tools: [orderLookupTool]
};

/**
 * Generator-based support agent
 * 
 * Yields steps as execution progresses:
 * 1. thinking - Initial processing
 * 2. llm_response - LLM returned text/tool request
 * 3. tool_call - Executing a tool (if needed)
 * 4. tool_result - Tool execution complete (if tool was called)
 * 5. final - Natural language response ready
 * 
 * @param userInput - User's message
 * @param opts - Optional configuration
 */
export async function* supportAgent(
  userInput: string,
  opts?: { client?: unknown }
): AsyncGenerator<AgentStep, void, unknown> {
  
  // Dev greeting shortcut
  if (process.env.MODE === "dev" && /^\s*(hi|hello|hey|are you there)\s*$/i.test(userInput)) {
    yield {
      type: 'final',
      timestamp: Date.now(),
      text: "SupportBot: Hello! How can I help you today?"
    };
    return;
  }

  const model = opts?.client || ollama(supportAgentConfig.model);
  const prompt = `${supportAgentConfig.instructions}\n\nUser: ${userInput}\nAssistant:`;

  // Step 1: Initial LLM call
  yield {
    type: 'thinking',
    timestamp: Date.now(),
    message: 'Processing your request...'
  };

  let llmResponse: LLMResponse;
  try {
    llmResponse = await generateText({ model, prompt }) as LLMResponse;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    yield {
      type: 'final',
      timestamp: Date.now(),
      text: `Sorry, something went wrong: ${errorMessage}`
    };
    return;
  }

  const llmText = llmResponse?.text || '';

  // Step 2: Yield LLM response
  yield {
    type: 'llm_response',
    timestamp: Date.now(),
    text: llmText,
    raw: llmResponse
  };

  // Step 3: Check for tool call
  let toolCallRequested: ToolCallRequest | null = null;
  try {
    const parsed = JSON.parse(llmText);
    const validated = ToolCallRequestSchema.safeParse(parsed);
    
    if (validated.success) {
      // Find the matching tool
      const tool = supportAgentConfig.tools.find(t => t.id === validated.data.tool);
      if (tool) {
        toolCallRequested = validated.data;
      }
    }
  } catch {
    // Not a tool call - treat as final response
  }

  // Step 4 & 5: Execute tool if requested
  if (toolCallRequested) {
    // Yield tool call step
    yield {
      type: 'tool_call',
      timestamp: Date.now(),
      toolId: orderLookupTool.id,
      toolName: orderLookupTool.name,
      parameters: { orderId: toolCallRequested.orderId }
    };

    // Execute tool
    let toolResult: unknown;
    try {
      toolResult = await orderLookupTool.execute({ orderId: toolCallRequested.orderId });
      
      // Yield tool result
      yield {
        type: 'tool_result',
        timestamp: Date.now(),
        toolId: orderLookupTool.id,
        result: toolResult
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      yield {
        type: 'tool_result',
        timestamp: Date.now(),
        toolId: orderLookupTool.id,
        result: null,
        error: errorMessage
      };
      
      yield {
        type: 'final',
        timestamp: Date.now(),
        text: `Sorry, I encountered an error looking up that information: ${errorMessage}`
      };
      return;
    }

    // Step 6: Synthesize natural language response
    yield {
      type: 'thinking',
      timestamp: Date.now(),
      message: 'Generating response...'
    };

    const followUpPrompt = `${supportAgentConfig.instructions}\n\nUser: ${userInput}\n\nTool Result: ${JSON.stringify(toolResult)}\n\nAssistant:`;
    
    try {
      const followUpResp = await generateText({ model, prompt: followUpPrompt }) as LLMResponse;
      
      yield {
        type: 'final',
        timestamp: Date.now(),
        text: followUpResp?.text || JSON.stringify(toolResult)
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      // Fallback to raw tool result
      yield {
        type: 'final',
        timestamp: Date.now(),
        text: JSON.stringify(toolResult)
      };
    }
  } else {
    // No tool needed - LLM response is the final answer
    yield {
      type: 'final',
      timestamp: Date.now(),
      text: llmText
    };
  }
}

// Export config for backwards compatibility
export const supportAgentModelSpec = supportAgentConfig.model;