import { mastra } from './mastra/index';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function startChat() {
  try {
    const agent = mastra.getAgent('supportAgent');
    console.log('--- Support Agent Live (Gemma 3) ---');

    while (true) {
      const userInput = await rl.question('You: ');
      if (userInput.toLowerCase() === 'exit') break;

      try {
        // We use generateLegacy to avoid the AI SDK version check
        const result = await agent.generateLegacy(userInput);
        console.log(`\nAgent: ${result.text}\n`);
      } catch (error: any) {
        console.error('\n--- EXECUTION ERROR ---');
        // If it fails, we print the FULL error so I can stop guessing
        console.dir(error, { depth: null });
      }
    }
  } catch (e) {
    console.error('CRITICAL ERROR:', e);
  }
}

startChat();