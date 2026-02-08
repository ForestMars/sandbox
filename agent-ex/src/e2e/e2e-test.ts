import { supportAgent } from '../agents/support-agent';

async function runE2E() {
  console.log('E2E: Invoice lookup (12345)');
  const invoiceGen = supportAgent('Please check invoice #12345');
  let invoiceFinal = '';
  for await (const step of invoiceGen) {
    if (step.type === 'final') invoiceFinal = (step as any).text || '';
  }

  console.log('Agent response:', invoiceFinal);

  if (/\{\s*"tool"/.test(invoiceFinal)) {
    console.error('E2E FAIL: Agent returned raw tool JSON for invoice lookup');
    process.exit(2);
  }

  if (!/Shipped|Processing|Not Found|deliveryDate/i.test(invoiceFinal)) {
    console.error('E2E FAIL: Invoice response does not include expected order info');
    process.exit(3);
  }

  console.log('E2E: Basic conversational check');
  const convoGen = supportAgent('What is your name?');
  let convoFinal = '';
  for await (const step of convoGen) {
    if (step.type === 'final') convoFinal = (step as any).text || '';
  }

  console.log('Agent response:', convoFinal);

  if (!convoFinal || convoFinal.length < 3) {
    console.error('E2E FAIL: conversational response empty');
    process.exit(4);
  }

  console.log('E2E PASS');
  process.exit(0);
}

runE2E().catch(e => { console.error(e); process.exit(1); });
