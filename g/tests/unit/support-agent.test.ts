import { test, expect } from 'bun:test';
import { supportAgent } from '../../src/agents/support-agent';

// Mock client that returns an object with `text` field
function makeMockClient(returnText: string) {
  return async function mockClient(_args: any) {
    return { text: returnText };
  };
}

test('agent calls orderLookupTool when SDK mentions order id', async () => {
  const mock = makeMockClient('I see order #12345 in your message');
  const res = await supportAgent.generate('Please check order #12345', { client: mock, persona: 'friendly' });
  expect(res).toBeTruthy();
  expect(res.text).toSatisfy((t: string) => t.includes('Shipped') || t.includes('Not Found'));
});

test('agent returns SDK text when no tool invocation needed', async () => {
  const mock = makeMockClient('Hello — I am your assistant');
  const res = await supportAgent.generate('Say hello', { client: mock });
  expect(res).toBeTruthy();
  expect(res.text).toContain('Hello');
  expect(res.steps[0].finishReason).toBe('stop');
});
