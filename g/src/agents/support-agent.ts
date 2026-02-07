// src/agents/support-agent.ts

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

export const supportAgentModelSpec =
  process.env.SUPPORT_AGENT_MODEL || active_model;

export const supportAgent = {
  name: 'SupportBot',
  modelSpec: supportAgentModelSpec,

  /**
   * Generate a response from the agent.
   * The model is authoritative: tool calls are only triggered if the model indicates it.
   */
  async generate(userInput: string, _opts?: { persona?: Persona; client?: any }) {
    const steps: Array<any> = [];
    let topText = '';

    // Determine persona: per-call override, env var, or default 'friendly'
    let persona: Persona =
      _opts?.persona || (process.env.SUPPORT_AGENT_PERSONA as Persona) || 'friendly';
    if (/\b(cut the persona|no persona|raw output|just give me the raw|no persona please)\b/i.test(userInput)) {
      persona = 'raw';
    }

    // Initialize the model client
    const client: any = _opts?.client ?? ollama(supportAgentModelSpec);

    // Construct prompt
    const prompt = `${instructions}\n\nUser: ${userInput}\nAssistant: Please determine if this message requires a tool call (e.g., order lookup). Respond in JSON if a tool call is needed, otherwise respond normally.\n`;

    // Call the model
    let sdkResp: any;
    try {
      if (typeof client === 'function') {
        sdkResp = await client({ prompt });
      } else if (typeof client.generate === 'function') {
        sdkResp = await client.generate({ prompt });
      } else if (typeof client.create === 'function') {
        sdkResp = await client.create({ prompt });
      } else if (typeof client.predict === 'function') {
        sdkResp = await client.predict({ prompt });
      } else {
        throw new Error('No valid client method found');
      }
    } catch (e) {
      steps.push({ finishReason: 'error', text: `LLM call failed: ${e}`, toolCalls: [] });
      return { text: `Sorry, something went wrong: ${e}`, steps };
    }

    // Helper to extract text from various SDK response shapes
    const extractText = (resp: any) => {
      if (!resp) return null;
      if (typeof resp === 'string') return resp;
      if (resp.text) return resp.text;
      if (resp.output && Array.isArray(resp.output) && resp.output[0]?.content) return resp.output[0].content;
      if (resp.outputs && Array.isArray(resp.outputs) && resp.outputs[0]?.content) return resp.outputs[0].content;
      if (resp.choices && Array.isArray(resp.choices) && resp.choices[0]?.message?.content) return resp.choices[0].message.content;
      if (resp.choices && Array.isArray(resp.choices) && resp.choices[0]?.text) return resp.choices[0].text;
      return JSON.stringify(resp);
    };

    const sdkText = extractText(sdkResp) || '';

    // Attempt to parse JSON from model for structured tool calls
    let toolCallRequested = null;
    try {
      // Expect model to output JSON like: { "tool": "order_lookup", "orderId": "1234" }
      const json = JSON.parse(sdkText);
      if (json.tool === orderLookupTool.id && json.orderId) {
        toolCallRequested = json;
      }
    } catch {
      // Not JSON — assume normal message
    }

    if (toolCallRequested) {
      // Model explicitly requested tool call
      const toolResult = await orderLookupTool.execute({ orderId: toolCallRequested.orderId });
      const toolCall = { toolId: orderLookupTool.id, result: toolResult };
      steps.push({ finishReason: 'tool', text: `Called tool ${orderLookupTool.id}`, toolCalls: [toolCall] });
      topText = formatToolResult(persona, { id: orderLookupTool.id, description: orderLookupTool.description }, toolResult, userInput);
    } else {
      // Model returned normal message
      steps.push({ finishReason: 'stop', text: sdkText, toolCalls: [] });
      topText = sdkText || `SupportBot: I received your message -> ${userInput}`;
    }

    return { text: topText, steps };
  },
};
