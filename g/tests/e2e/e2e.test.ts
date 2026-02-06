import { test, expect } from 'bun:test';
import { supportAgent } from '../../src/agents/support-agent';

test('e2e: supportAgent order lookup', async () => {
  const res = await supportAgent.generate('Please check order #12345');
  expect(res).toBeTruthy();
  expect(res.text).toSatisfy((t: string) => typeof t === 'string' && (t.includes('Shipped') || t.includes('Not Found')));
});
