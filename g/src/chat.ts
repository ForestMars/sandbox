import { mastra } from './mastra/index';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function startChat() {
  try {
    // Lookup the agent from the Mastra instance
    const agent = mastra.getAgent('supportAgent');
    
    console.log('--- Support Agent Live ---');
    console.log('Type your message. Type "exit" to quit.\n');

    while (true) {
      const userInput = await rl.question('You: ');

      if (userInput.toLowerCase() === 'exit') {
        rl.close();
        process.exit(0);
      }

      try {
        /* * FIX: Using generateLegacy() because @mastra/ollama 
         * provides a v4-compatible model spec.
         */
        const result = await agent.generateLegacy(userInput);
        
        console.log(`\nAgent: ${result.text}\n`);
      } catch (error: any) {
        console.error('\n--- EXECUTION ERROR ---');
        console.error(error.message);
        if (error.stack) {
          console.error(error.stack);
        }
      }
    }
  } catch (e) {
    console.error('CRITICAL INITIALIZATION ERROR:', e);
  }
}

startChat();