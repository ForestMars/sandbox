// src/agents/support-agent.ts

import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { readFileSync } from 'fs';
import { join } from 'path';

const active_model = 'qwen2.5:7b';
const instructions = readFileSync(
  join(process.cwd(), 'config', 'agent-instructions.txt'),
  'utf-8'
);

export const supportAgentModelSpec = process.env.SUPPORT_AGENT_MODEL || active_model;

/**
 * Step in the agent's execution workflow
 */
interface AgentStep {
  finishReason: 'stop' | 'tool' | 'error';
  text: string;
  toolCalls: Array<{ toolId: string; result: any }>;
}

/**
 * Result returned by the support agent
 */
interface AgentResult {
  text: string;
  steps: AgentStep[];
}

/**
 * Support Agent Workflow:
 * 
 * 1. INITIAL LLM CALL
 *    - Sends user input + instructions to LLM
 *    - LLM either responds with text OR requests a tool call (JSON format)
 * 
 * 2. TOOL CALL DETECTION
 *    - Attempts to parse LLM response as JSON
 *    - If valid tool call detected (matches orderLookupTool.id), proceed to step 3
 *    - Otherwise, treat as regular text response and skip to step 5
 * 
 * 3. TOOL EXECUTION
 *    - Execute the requested tool (e.g., orderLookupTool)
 *    - Record tool execution in steps array
 * 
 * 4. FOLLOW-UP LLM CALL
 *    - Send original user input + tool result back to LLM
 *    - LLM converts structured data into natural language response
 * 
 * 5. RETURN FINAL RESPONSE
 *    - Return natural language response to user
 *    - Include all steps taken for debugging/logging
 */
export const supportAgent = {
  name: 'SupportBot',
  modelSpec: supportAgentModelSpec,

  /**
   * Generate a response to user input
   * @param userInput - The user's message
   * @param _opts - Optional configuration (e.g., custom LLM client)
   * @returns Agent response with text and execution steps
   */
  async generate(userInput: string, _opts?: { client?: any }): Promise<AgentResult> {
    const steps: AgentStep[] = [];
    let finalResponse = '';

    // STEP 0: Dev greeting shortcut (bypass LLM for simple greetings in dev mode)
    if (process.env.MODE === "dev" && /^\s*(hi|hello|hey|are you there)\s*$/i.test(userInput)) {
      const text = "SupportBot: Hello! How can I help you today?";
      return { text, steps: [{ finishReason: "stop", text, toolCalls: [] }] };
    }

    const model = _opts?.client || ollama(supportAgentModelSpec);
    const prompt = `${instructions}\n\nUser: ${userInput}\nAssistant:`;

    // STEP 1: Initial LLM call
    let sdkResp: any;
    try {
      sdkResp = await generateText({ model, prompt });
    } catch (e) {
      steps.push({ finishReason: 'error', text: `LLM call failed: ${e}`, toolCalls: [] });
      return { text: `Sorry, something went wrong: ${e}`, steps };
    }

    const sdkText = sdkResp?.text || '';

    // STEP 2: Tool call detection - parse JSON to see if LLM is requesting a tool
    let toolCallRequested: { tool: string; orderId: string } | null = null;
    try {
      const json = JSON.parse(sdkText);
      if (json.tool === orderLookupTool.id && json.orderId) {
        toolCallRequested = json;
      }
    } catch {
      // Not JSON or invalid format - treat as regular text response
    }

    // STEP 3 & 4: Execute tool and get natural language response
    if (toolCallRequested) {
      // STEP 3: Execute the tool
      const toolResult = await orderLookupTool.execute({ orderId: toolCallRequested.orderId });
      steps.push({
        finishReason: 'tool',
        text: JSON.stringify(toolResult),
        toolCalls: [{ toolId: orderLookupTool.id, result: toolResult }],
      });
      
      // STEP 4: Follow-up LLM call to convert tool result to natural language
      const followUpPrompt = `${instructions}\n\nUser: ${userInput}\n\nTool Result: ${JSON.stringify(toolResult)}\n\nAssistant:`;
      
      try {
        const followUpResp = await generateText({ model, prompt: followUpPrompt });
        finalResponse = followUpResp?.text || JSON.stringify(toolResult);
        steps.push({ finishReason: 'stop', text: finalResponse, toolCalls: [] });
      } catch (e) {
        finalResponse = JSON.stringify(toolResult); // Fallback to raw data
        steps.push({ finishReason: 'error', text: `Follow-up LLM call failed: ${e}`, toolCalls: [] });
      }
    } else if (sdkText) {
      // STEP 5A: Regular text response (no tool needed)
      steps.push({ finishReason: 'stop', text: sdkText, toolCalls: [] });
      finalResponse = sdkText;
    } else {
      // STEP 5B: Fallback if we get no response at all
      finalResponse = `SupportBot: I received your message -> ${userInput}`;
      steps.push({ finishReason: 'stop', text: finalResponse, toolCalls: [] });
    }

    return { text: finalResponse, steps };
  },
};