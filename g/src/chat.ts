// Use curly braces for the named import
import { mastra } from './mastra/index.js'; 
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function startChat() {
  // Debug line: This will tell us if mastra is actually loaded
  if (!mastra) {
    console.error('Mastra instance is undefined. Check your export in src/mastra/index.ts');
    return;
  }

  const agent = mastra.getAgent('Support Pro');
  
  console.log('--- Support Agent Live (Ollama) ---');
  console.log('Type your message. Type "exit" to quit.\n');

  while (true) {
    const userInput = await rl.question('You: ');

    if (userInput.toLowerCase() === 'exit') {
      rl.close();
      break;
    }

    try {
      const result = await agent.generate(userInput);
      console.log(`\nAgent: ${result.text}\n`);
    } catch (error) {
      console.error('\nError: Is Ollama running?');
    }
  }
}

startChat();