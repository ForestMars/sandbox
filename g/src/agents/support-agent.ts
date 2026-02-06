// src/agents/support-agent.ts

import { ollama } from 'ai-sdk-ollama';
import { orderLookupTool } from '../tools/order-tools';
import { formatToolResult, type Persona } from '../personas';
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

    // Determine persona: per-call override, env var, or default 'friendly'
    let persona: Persona = (_opts && _opts.persona) || (process.env.SUPPORT_AGENT_PERSONA as Persona) || 'friendly';
    // If the user explicitly asks to "cut the persona" or similar, force raw
    if (/\b(cut the persona|no persona|raw output|just give me the raw|no persona please)\b/i.test(userInput)) {
      persona = 'raw';
    }

    // Allow injecting a mock client via opts for testing; otherwise create the ollama client
    let client: any = _opts?.client ?? null;
    if (!client) {
      try {
        client = ollama(supportAgentModelSpec);
      } catch (e) {
        client = null;
      }
    }

    // Helper to extract text from various SDK response shapes @TODO: move to a shared utility if we end up with more agents and/or more SDKs
    const extractText = (resp: any) => {
      if (!resp) return null;
      if (typeof resp === 'string') return resp;

      // Common when using Ollama directly with generate() - it returns { text, ...metadata }
      if (resp.text) return resp.text;
      
      // Common in LangChain or certain AWS Bedrock abstractions
      if (resp.output && Array.isArray(resp.output) && resp.output[0]?.content) return resp.output[0].content;

      // Possibly not needed (outputs, not output) but just in case
      if (resp.outputs && Array.isArray(resp.outputs) && resp.outputs[0]?.content) return resp.outputs[0].content;
      
      // classic OpenAI Chat Completions format (also used by Mistral and Groq).
      if (resp.choices && Array.isArray(resp.choices) && resp.choices[0]?.message?.content) return resp.choices[0].message.content;
      
      // OpenAI Legacy format (from the gpt-3.5-turbo-instruct days).
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

      // Pass generic tool metadata to the persona formatter so personas remain
      // decoupled from specific tool internals and can handle future tools.
      topText = formatToolResult(persona, { id: orderLookupTool.id, description: orderLookupTool.description }, toolResult, userInput);
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
