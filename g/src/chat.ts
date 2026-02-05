import { mastra } from './mastra/index';
import { supportAgentModelSpec } from './mastra/agents/support-agent';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function startChat() {
  const agent = mastra.getAgent('supportAgent');
  console.log(`Loaded model: ${supportAgentModelSpec}`);

  while (true) {
    const userInput = await rl.question('You: ');
    if (userInput.toLowerCase() === 'exit') break;

    try {
      const result = await agent.generate(userInput, { 
        maxSteps: 5, 
        toolChoice: 'auto',
      });

      console.log('\n--- ACTUAL MODEL STEPS ---');
      result.steps.forEach((step, i) => {
        console.log(`Step ${i} Finish Reason: ${step.finishReason}`);
        // This is where the model's actual "message" lives
        console.log(`Step ${i} Content:`, JSON.stringify(step.text, null, 2));
        
        if (step.toolCalls.length > 0) {
          console.log(`Step ${i} Tool Calls:`, JSON.stringify(step.toolCalls, null, 2));
        }
      });
      console.log('--------------------------\n');

      if (result.text) {
        console.log(`Agent: ${result.text}\n`);
      }
    } catch (error: any) {
      console.error('\n--- ERROR ---', error.message || error);
    }
  }
}

startChat();