import assert from 'node:assert';
import { formatToolResult } from '../src/personas';

function run() {
  // Friendly persona with typical order tool result
  const friendly = formatToolResult('friendly' as any, { id: 'orderLookupTool', description: 'Lookup order' }, { status: 'Shipped', deliveryDate: '2026-02-10' }, '#12345');
  assert.ok(friendly.includes('I have your answer'), 'friendly should use conversational prefix');
  assert.ok(friendly.includes('Shipped'), 'friendly should include status');

  // Formal persona
  const formal = formatToolResult('formal' as any, { id: 'orderLookupTool' }, { status: 'Processing' }, '#67890');
  assert.ok(formal.includes('Result for'), 'formal should use formal prefix');
  assert.ok(formal.includes('Processing'), 'formal should include status');

  // Raw persona returns JSON
  const raw = formatToolResult('raw' as any, { id: 'orderLookupTool' }, { status: 'Not Found' }, '#999');
  assert.ok(raw.includes('Not Found') || raw.includes('"status"'), 'raw should include raw data');

  // Generic object summarization
  const obj = formatToolResult('friendly' as any, { id: 'ragTool' }, { title: 'FAQ', excerpt: 'Answer here' }, 'tell me about X');
  assert.ok(obj.includes('FAQ') || obj.includes('excerpt'), 'should summarize small objects');

  console.log('All persona tests passed');
}

run();
