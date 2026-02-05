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
        const result = await agent.generate(userInput);
        console.log(`\nAgent: ${result.text}\n`);
      } catch (error: any) {
        console.error('\n--- EXECUTION ERROR ---');
        console.error(error.message || error);
      }
    }
  } catch (e) {
    console.error('Init Error:', e);
  }
}

startChat();