import { supportAgent } from './agents/support-agent';

async function testSupportFlow() {
  const agent = supportAgent;

  console.log('--- Test 1: Tool Usage ---');
  // This should trigger the orderLookup tool
  const gen1 = agent("I need the status of order #999");
  let res1Text = '';
  const res1Steps: any[] = [];
  for await (const step of gen1) {
    res1Steps.push(step);
    if (step.type === 'final') res1Text = (step as any).text;
  }
  console.log('User: I need the status of order #999');
  console.log('Agent:', res1Text);

  console.log('\n--- Test 2: General Inquiry ---');
  // This should NOT trigger a tool (just conversational)
  const gen2 = agent("What is your name?");
  let res2Text = '';
  for await (const step of gen2) {
    if (step.type === 'final') res2Text = (step as any).text;
  }
  console.log('User: What is your name?');
  console.log('Agent:', res2Text);
}

testSupportFlow().catch(console.error);
