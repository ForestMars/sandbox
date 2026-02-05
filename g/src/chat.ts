import { mastra } from './mastra/index.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function startChat() {
  const agent = mastra.getAgent('Support Pro');
  
  console.log('--- Support Agent Live (Ollama) ---');
  console.log('Type your message to start. Type "exit" to quit.\n');

  while (true) {
    const userInput = await rl.question('You: ');

    if (userInput.toLowerCase() === 'exit') {
      rl.close();
      break;
    }

    try {
      // We pass the user input to the agent
      const result = await agent.generate(userInput);
      
      console.log(`\nAgent: ${result.text}\n`);
    } catch (error) {
      console.error('\nError connecting to Ollama. Is it running?');
    }
  }
}

startChat();