import { supportAgent } from './agents/support-agent';

// Focused smoke test: confirm requesting invoice #12345 returns a natural-language
// response (not a raw tool-call JSON) and contains expected information from the
// mocked order lookup (e.g. "Shipped"). This file is intentionally minimal so
// `bun run agent:test` / `npm run agent:test` runs quickly.

async function runSmokeTest() {
  const input = 'We need to know the status of invoice #12345';
  const gen = supportAgent(input);

  let finalText = '';
  for await (const step of gen) {
    if (step.type === 'final') {
      finalText = (step as any).text || '';
      break;
    }
  }

  console.log('User:', input);
  console.log('Agent Final:', finalText);

  // Validate the final response is natural language and contains expected info
  const looksLikeToolJson = /^\s*\{\s*"tool"/i.test(finalText.trim());
  const containsExpected = /Shipped|Processing|Not Found|NotFound|deliveryDate|12345/i.test(finalText);

  if (looksLikeToolJson) {
    console.error('SMOKE TEST FAIL: agent returned raw tool-call JSON instead of a natural-language response');
    process.exit(2);
  }

  if (!containsExpected) {
    console.error('SMOKE TEST FAIL: final response did not contain expected order information');
    process.exit(3);
  }

  console.log('SMOKE TEST PASS');
  process.exit(0);
}

runSmokeTest().catch(e => { console.error(e); process.exit(1); });
