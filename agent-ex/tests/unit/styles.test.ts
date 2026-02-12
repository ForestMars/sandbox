/**
 * @file styles.test.ts
 * @description Unit tests for agent response styles.
 */
import { test, expect } from 'bun:test';
import { formatToolResult } from '../../packages/agents/style';

test('friendly style summarizes order tool result', () => {
  const friendly = formatToolResult('friendly', { id: 'entityLookupTool', description: 'Lookup entity' }, { status: 'Shipped', deliveryDate: '2026-02-10' }, '#12345');
  expect(friendly).toContain('I have your answer');
  expect(friendly).toContain('Shipped');
});

test('formal style produces concise summary', () => {
  const formal = formatToolResult('formal', { id: 'entityLookupTool' }, { status: 'Processing' }, '#67890');
  expect(formal).toContain('Result for');
  expect(formal).toContain('Processing');
});

test('raw style returns raw data', () => {
  const raw = formatToolResult('raw', { id: 'entityLookupTool' }, { status: 'Not Found' }, '#999');
  expect(raw).toSatisfy((v: string) => v.includes('Not Found') || v.includes('"status"'));
});

test('generic object summarization', () => {
  const obj = formatToolResult('friendly', { id: 'ragTool' }, { title: 'FAQ', excerpt: 'Answer here' }, 'tell me about X');
  expect(obj).toSatisfy((v: string) => v.includes('FAQ') || v.includes('excerpt'));
});
