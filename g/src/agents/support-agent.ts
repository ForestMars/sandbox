// src/agents/support-agent.ts

import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { formatToolResult, type Persona } from '../personas';
import { readFileSync } from 'fs';
import { join } from 'path';

const active_model = 'qwen2.5:7b';
const instructions = readFileSync(
  join(process.cwd(), 'config', 'agent-instructions.txt'),
  'utf-8'
);

export const supportAgentModelSpec = process.env.SUPPORT_AGENT_MODEL || active_model;

export const supportAgent = {
  name: 'SupportBot',
  modelSpec: supportAgentModelSpec,

  async generate(userInput: string, _opts?: { persona?: Persona; client?: any }) {
    const steps: Array<any> = [];
    let topText = '';

    // Determine persona
    let persona: Persona = _opts?.persona || (process.env.SUPPORT_AGENT_PERSONA as Persona) || 'friendly';
    if (/\b(cut the persona|no persona|raw output|just give me the raw|no persona please)\b/i.test(userInput)) {
      persona = 'raw';
    }

    // Use injected client or default to Ollama model spec
    const model = _opts?.client || ollama(supportAgentModelSpec);

    // Build prompt
    const prompt = `${instructions}\n\nUser: ${userInput}\nAssistant:`;

    // Call the model via SDK
    let sdkResp: any;
    try {
      sdkResp = await generateText({ model, prompt });
    } catch (e) {
      steps.push({ finishReason: 'error', text: `LLM call failed: ${e}`, toolCalls: [] });
      return { text: `Sorry, something went wrong: ${e}`, steps };
    }

    const sdkText = sdkResp?.text || '';

    // Try to parse JSON tool call
    let toolCallRequested = null;
    try {
      const json = JSON.parse(sdkText);
      if (json.tool === orderLookupTool.id && json.orderId) {
        toolCallRequested = json;
      }
    } catch {
      // Not JSON — ignore
    }

    if (toolCallRequested) {
      const toolResult = await orderLookupTool.execute({ orderId: toolCallRequested.orderId });
      const toolCall = { toolId: orderLookupTool.id, result: toolResult };
      steps.push({ finishReason: 'tool', text: `Called tool ${orderLookupTool.id}`, toolCalls: [toolCall] });

      topText = formatToolResult(
        persona,
        { id: orderLookupTool.id, description: orderLookupTool.description },
        toolResult,
        userInput
      );
    } else if (sdkText) {
      steps.push({ finishReason: 'stop', text: sdkText, toolCalls: [] });
      topText = sdkText;
    } else {
      topText = `SupportBot: I received your message -> ${userInput}`;
      steps.push({ finishReason: 'stop', text: topText, toolCalls: [] });
    }

    return { text: topText, steps };
  },
};
