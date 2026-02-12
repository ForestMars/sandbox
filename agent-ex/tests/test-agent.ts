import { supportAgent } from '../src/agents/support-agent';
import { logger } from '../src/logger';
import { entityLookupTool } from '../src/tools/order-tools';

// Focused smoke test: confirm requesting invoice #12345 returns a natural-language
// response (not a raw tool-call JSON) and contains expected information from the
// mocked order lookup (e.g. "Shipped"). This file is intentionally minimal so
// `bun run agent:test` / `npm run agent:test` runs quickly.

async function runSmokeTest() {
  const input = 'We need to know the status of invoice #12345';
  const tools = {
    'entity-status-lookup': entityLookupTool,
    'invoice-status-lookup': entityLookupTool,
    'invoice-status': entityLookupTool,
    'order-lookup': entityLookupTool,
  } as any;

  const gen = supportAgent(input, undefined, { tools });

  let finalText = '';
  for await (const step of gen) {
    if (step.type === 'final') {
      finalText = (step as any).text || '';
      break;
    }
  }

  logger.info('User:', input);
  logger.info('Agent Final:', finalText);

  // Validate the final response is natural language and contains expected info
  const looksLikeToolJson = /^\s*\{\s*"tool"/i.test(finalText.trim());
  const containsExpected = /Shipped|Processing|Not Found|NotFound|deliveryDate|12345/i.test(finalText);

  if (looksLikeToolJson) {
    logger.error('SMOKE TEST FAIL: agent returned raw tool-call JSON instead of a natural-language response');
    process.exit(2);
  }

  if (!containsExpected) {
    logger.error('SMOKE TEST FAIL: final response did not contain expected order information');
    process.exit(3);
  }

  logger.info('SMOKE TEST PASS');
  process.exit(0);
}

runSmokeTest().catch(e => { logger.error(e); process.exit(1); });
