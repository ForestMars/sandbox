// src/chat.ts

import { supportAgent, supportAgentModelSpec } from './agents/support-agent';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { AgentStep } from './types/agent-types';

const rl = readline.createInterface({ input, output });

const DEBUG = true;

async function startChat() {
  console.log(`Loaded model: ${supportAgentModelSpec}\n`);

  while (true) {
    const userInput = await rl.question('You: ');
    if (userInput.toLowerCase() === 'exit') break;

    try {
      const steps: AgentStep[] = [];
      let finalText = '';

      // Consume the generator - supportAgent is now a function, not an object
      for await (const step of supportAgent(userInput)) {
        steps.push(step);
        console.log(`\n[${step.type.toUpperCase()}]`, formatStep(step));
        
        if (DEBUG) {
          console.log(`[${step.type.toUpperCase()}]`, formatStep(step));
        }

        if (step.type === 'final') {
          finalText = step.text;
        }
      }

      console.log(`\nAgent: ${finalText}\n`);

      if (DEBUG) {
        console.log(`[DEBUG] Total steps: ${steps.length}`);
        console.log(`[DEBUG] Step sequence: ${steps.map(s => s.type).join(' → ')}\n`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error:', errorMessage);
    }
  }
}

/**
 * Format a step for debug output
 */
function formatStep(step: AgentStep): string {
  switch (step.type) {
    case 'thinking':
      return step.message;
    case 'llm_response':
      return step.text.substring(0, 100) + (step.text.length > 100 ? '...' : '');
    case 'tool_call':
      return `${step.toolName}(${JSON.stringify(step.parameters)})`;
    case 'tool_result':
      return step.error || JSON.stringify(step.result);
    case 'final':
      return step.text;
  }
}

startChat();