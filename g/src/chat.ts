// src/chat.ts

import { supportAgent, supportAgentModelSpec } from './agents/support-agent';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

const DEBUG = true;

async function startChat() {
  const agent = supportAgent;
  console.log(`Loaded model: ${supportAgentModelSpec}\n`);

  while (true) {
    const userInput = await rl.question('You: ');
    if (userInput.toLowerCase() === 'exit') break;

    try {
      const result = await agent.generate(userInput, { 
        maxSteps: 5, 
        toolChoice: 'auto',
      });

      if (DEBUG) {
        console.log(`\n[DEBUG] Steps taken: ${result.steps.length} / maxSteps: 5`);
        console.log(`[DEBUG] Overall finishReason: ${result.finishReason}`);
        console.log(`[DEBUG] Response messages count: ${result.response?.messages?.length || 0}`);
        
        result.steps.forEach((step, i) => {
          console.log(`\n  Step ${i}:`);
          console.log(`    finishReason: ${step.finishReason}`);
          console.log(`    text: ${step.text ? `"${step.text}"` : 'NONE'}`);
          console.log(`    toolCalls: ${step.toolCalls?.length || 0}`);
          console.log(`    toolResults: ${step.toolResults?.length || 0}`);
          
          if (step.toolResults?.length > 0) {
            step.toolResults.forEach(tr => {
              console.log(`      Result: ${JSON.stringify(tr.payload.result)}`);
            });
          }
        });
        
        console.log(`\n  Response message chain:`);
        result.response?.messages?.forEach((msg, i) => {
          const contentType = msg.content?.[0]?.type || 'unknown';
          console.log(`    ${i}. role=${msg.role}, contentType=${contentType}`);
        });
        
        console.log(`\n  Why only ${result.steps.length} step(s)?`);
        console.log(`    - Last step finishReason: ${result.steps[result.steps.length - 1]?.finishReason}`);
        console.log(`    - Tool results present: ${result.toolResults?.length > 0 ? 'YES' : 'NO'}`);
        console.log(`    - reliable_tool_calling: ${result.providerMetadata?.ollama?.reliable_tool_calling}\n`);
      }

      if (result.text) {
        console.log(`Agent: ${result.text}\n`);
      } else {
        console.log('⚠️  No response generated\n');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }
}

startChat();