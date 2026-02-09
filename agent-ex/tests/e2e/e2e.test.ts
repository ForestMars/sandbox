import { test, expect } from "bun:test";
import { supportAgent } from '@/agents/support-agent';

const TEST_TIMEOUT = 90000; // Needed for local inference 

test('E2E: Invoice lookup (12345)', async () => {
  const invoiceGen = supportAgent('Please check invoice #12345');
  let invoiceFinal = '';
  
  for await (const step of invoiceGen) {
    if (step.type === 'final') invoiceFinal = (step as any).text || '';
  }

  console.log('Agent response:', invoiceFinal);

  // Assertions replace your process.exit logic
  expect(invoiceFinal).not.toMatch(/\{\s*"tool"/); // Should not be raw JSON
  expect(invoiceFinal).toMatch(/Shipped|Processing|Not Found|deliveryDate/i);
}, TEST_TIMEOUT);

test('E2E: Basic conversational check', async () => {
  const convoGen = supportAgent('What is your name?');
  let convoFinal = '';
  
  for await (const step of convoGen) {
    if (step.type === 'final') convoFinal = (step as any).text || '';
  }

  console.log('Agent response:', convoFinal);
  expect(convoFinal.length).toBeGreaterThan(3);
}, TEST_TIMEOUT);