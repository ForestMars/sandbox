import { mastra } from './mastra/index';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function startChat() {
  try {
    // Ensure the agent name matches exactly what you defined in your mastra/index.ts
    const agent = mastra.getAgent('supportAgent');
    
    // @TODO
    console.log('\n--- Support Agent Live (Qwen 2.5 Coder ) ---');
    console.log('Type "exit" to quit.\n');

    while (true) {
      const userInput = await rl.question('You: ');
      
      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      try {
        // maxSteps: 5 allows the agent to call the tool and then process the result
        const result = await agent.generate(userInput, {
          maxSteps: 5,
        });

        // THIS IS THE RAW OUTPUT FROM THE MODEL
        console.log('\n--- RAW MODEL OUTPUT ---');
        console.log(JSON.stringify(result.raw, null, 2)); 
        console.log('------------------------\n');

        if (result.text && result.text.includes('```json')) {
          console.log('\n[System] Model sent raw JSON. Attempting to force tool execution...');
          // This usually means the model needs a clearer system prompt or a different version
      }
        // Mastra 1.0 encapsulates tool results in the steps array
        // We check if the model actually said something to the user
        if (result.text) {
          console.log(`\nAgent: ${result.text}\n`);
        } else {
          // Fallback if the model executed a tool but didn't generate a text summary
          const toolStep = result.steps.find(s => s.toolResults && s.toolResults.length > 0);
          
          if (toolStep) {
            const data = toolStep.toolResults[0].result;
            console.log(`\n[System Notification: Tool Executed]`);
            console.log(`Order ID: ${data.id} | Status: ${data.status} | Delivery: ${data.deliveryDate}\n`);
          } else {
            console.log('\nAgent: (No response generated)\n');
          }
        }
      } catch (error: any) {
        console.error('\n--- EXECUTION ERROR ---');
        // This provides more depth than just the message
        console.error(error?.message || error);
      }
    }
  } catch (e) {
    console.error('\n--- INITIALIZATION ERROR ---');
    console.error(e);
  } finally {
    rl.close();
  }
}

// Call the function and catch any unhandled promise rejections
startChat().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});