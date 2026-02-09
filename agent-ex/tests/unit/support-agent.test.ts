import { test, expect } from 'bun:test';
import { supportAgent } from '../../src/agents/support-agent';

/**
 * Mock client that adheres to the AI SDK LanguageModelV2 spec.
 * This prevents the UnsupportedModelVersionError.
 */
function makeMockClient(returnText: string) {
  return {
    specificationVersion: 'v2' as const,
    provider: 'test-provider',
    modelId: 'mock-model',
    doGenerate: async () => ({
      text: returnText,
      // The SDK needs this content array to filter for tool calls internally
      content: [{ type: 'text', text: returnText }], 
      finishReason: 'stop' as const,
      usage: { promptTokens: 0, completionTokens: 0 },
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  } as any;
}

test('agent calls orderLookupTool when LLM triggers tool path', async () => {
  // We mock the first LLM pass to return a JSON string that triggers the tool logic
  const mockToolTrigger = JSON.stringify({ tool: 'invoice-status', orderId: '12345' });
  const mock = makeMockClient(mockToolTrigger);
  
  const gen = supportAgent('Please check order #12345', { client: mock });
  
  let toolCallSeen = false;
  let finalText = '';

  for await (const step of gen) {
    if (step.type === 'tool_call') {
      toolCallSeen = true;
      expect(step.parameters.orderId).toBe('12345');
    }
    if (step.type === 'final') {
      finalText = step.text;
    }
  }

  expect(toolCallSeen).toBe(true);
  // In our tool-branching logic, the "final" text comes from the second synthesis pass.
  // With this mock, it might just be the JSON again, but the plumbing is verified.
  expect(finalText).toBeTruthy();
});

test('agent returns direct text when no tool invocation needed', async () => {
  const greeting = 'Hello — I am your assistant';
  const mock = makeMockClient(greeting);
  
  const gen = supportAgent('Say hello', { client: mock });
  
  let steps: string[] = [];
  let finalText = '';

  for await (const step of gen) {
    steps.push(step.type);
    if (step.type === 'final') {
      finalText = step.text;
    }
  }

  // Verify the sequence: should just be thinking -> final
  expect(steps).toContain('thinking');
  expect(steps).toContain('final');
  expect(steps).not.toContain('tool_call');
  expect(finalText).toBe(greeting);
});