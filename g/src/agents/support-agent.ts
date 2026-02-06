// src/agents/support-agent.ts

import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { readFileSync } from 'fs';
import { join } from 'path';

const active_model = 'qwen2.5:7b';
const instructions = readFileSync(join(process.cwd(), 'config', 'agent-instructions.txt'), 'utf-8');

export const supportAgentModelSpec = process.env.SUPPORT_AGENT_MODEL || active_model;

// Minimal replacement for the Mastra Agent. Provides a `generate` method
// that returns a result shape compatible with previous callers.
export const supportAgent = {
  name: 'SupportBot',
  modelSpec: supportAgentModelSpec,
  async generate(userInput: string, _opts?: any) {
    const steps: Array<any> = [];
    let topText = '';

    const prompt = `${instructions}\n\nUser: ${userInput}\nAssistant:`;

    // Create the ollama client for the configured model spec
    let client: any;
    try {
      client = ollama(supportAgentModelSpec);
    } catch (e) {
      client = null;
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

    // Call the SDK if available, with defensive branching for different client APIs
    let sdkResp: any = null;
    if (client) {
      try {
        if (typeof client === 'function') {
          sdkResp = await client({ prompt });
        } else if (typeof client.generate === 'function') {
          sdkResp = await client.generate({ prompt });
        } else if (typeof client.create === 'function') {
          sdkResp = await client.create({ prompt });
        } else if (typeof client.predict === 'function') {
          sdkResp = await client.predict({ prompt });
        }
      } catch (e) {
        // SDK call failed — continue to fallback behavior below
        sdkResp = null;
      }
    }

    const sdkText = extractText(sdkResp) || '';

    // If the model's text mentions an order id, call the order lookup tool.
    const orderMatch = sdkText.match(/#\d+/) || userInput.match(/#\d+/);
    if (orderMatch) {
      const orderId = orderMatch[0];
      const toolResult = await orderLookupTool.execute({ orderId });
      const toolCall = { toolId: orderLookupTool.id, result: toolResult };
      steps.push({ finishReason: 'tool', text: `Called tool ${orderLookupTool.id}`, toolCalls: [toolCall] });

      // Optionally, form a final reply that includes the tool result. If the SDK produced
      // a reasonable reply already, prefer that; otherwise synthesize a short reply.
      topText = sdkText && sdkText.includes(orderId) ? sdkText : `Order ${orderId} status: ${toolResult.status}`;
    } else if (sdkText) {
      steps.push({ finishReason: 'stop', text: sdkText, toolCalls: [] });
      topText = sdkText;
    } else {
      // Fallback: simple echo
      topText = `SupportBot: I received your message -> ${userInput}`;
      steps.push({ finishReason: 'stop', text: topText, toolCalls: [] });
    }

    return { text: topText, steps };
  },
};
