import { test, expect } from "bun:test";
import { supportAgent } from '@/agents/support-agent';

const TEST_TIMEOUT = 90000; 

test('E2E: Invoice lookup (12345)', async () => {
  // Create the session context needed for the Graph
  const session = { id: 'test-12345', events: [] };
  
  const invoiceGen = supportAgent('Please check invoice #12345', session);
  let invoiceFinal = '';
  
  for await (const step of invoiceGen) {
    if (step.type === 'final') invoiceFinal = (step as any).text || '';
  }

  expect(invoiceFinal).not.toMatch(/\{\s*"tool"/);
  expect(invoiceFinal).toMatch(/Shipped|Processing|Not Found|deliveryDate/i);
}, TEST_TIMEOUT);

test('E2E: Basic conversational check', async () => {
  // Create the session context needed for the Graph
  const session = { id: 'test-convo', events: [] };
  
  const convoGen = supportAgent('What is your name?', session);
  let convoFinal = '';
  
  for await (const step of convoGen) {
    if (step.type === 'final') convoFinal = (step as any).text || '';
  }

  expect(convoFinal.length).toBeGreaterThan(3);
}, TEST_TIMEOUT);