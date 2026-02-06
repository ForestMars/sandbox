import { supportAgent } from '../src/agents/support-agent';

async function runE2E() {
  console.log('Running E2E test: supportAgent order lookup');

  const res = await supportAgent.generate('Please check order #12345');

  if (!res || !res.text) {
    console.error('E2E failed: no response text');
    process.exit(2);
  }

  if (!res.text.includes('Shipped') && !res.text.includes('Not Found')) {
    console.error('E2E failed: unexpected response:', res.text);
    process.exit(2);
  }

  console.log('E2E passed:', res.text);
}

runE2E().catch(err => {
  console.error('E2E error:', err);
  process.exit(2);
});
