/**
 * @file chat.ts
 * @description Main entry point for the Customer Support Agent CLI.
 * Handles user input via readline and orchestrates the supportAgent generator.
 */
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { z } from 'zod';

import { logger } from '@/logger'; // Assuming logger.ts is in the same dir
import type { AgentStep } from './types/agent-types';
import { supportAgent, supportAgentModelSpec } from './agents/support-agent';

const DEBUG = true;

/**
 * Main chat loop logic, exported for integration testing.
 * The readline interface is created inside the function to allow for 
 * clean mocking and to prevent top-level side effects during testing.
 */
export async function startChat() {
  console.log(`Loaded model: ${supportAgentModelSpec}\n`);
  logger.debug({ model: supportAgentModelSpec }, '>>> LOGGER_CHECK: Chat starting up');
  logger.debug({ model: supportAgentModelSpec }, 'Chat session initializing');
  const rl = readline.createInterface({ input, output });

  // Initialize the global workspace. This lives outside the loop so it persists across multiple turns.
  const session: AgentSession = {
    id: 'cli-session-' + Date.now(),
    events: []
  };

  try {
    while (true) {
      const userInput = await rl.question('You: ');
      
      // Allow user to exit the loop
      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      try {
        const steps: AgentStep[] = [];
        let finalText = '';

        // Consume the generator from the support agent
        for await (const step of supportAgent(userInput, session)) {
          steps.push(step);
          
          if (DEBUG) {
            console.log(`\n[${step.type.toUpperCase()}]`, formatStep(step));
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
        console.error('Error in agent execution:', errorMessage);
      }
    }
  } finally {
    // Ensure the terminal interface is released
    rl.close();
  }
}

/**
 * Format an AgentStep for debug output in the terminal.
 * @param step The step to format
 * @returns A string representation of the step
 */
function formatStep(step: AgentStep): string {
  switch (step.type) {
    case 'thinking':
      return step.message;
    case 'llm_response':
      return step.text.substring(0, 100) + (step.text.length > 100 ? '...' : '');
    case 'tool_call':
      return `${step.toolId}(${JSON.stringify(step.parameters)})`;
    case 'tool_result':
      return step.error || JSON.stringify(step.result);
    case 'final':
      return step.text;
    default:
      return 'Unknown step type';
  }
}

/**
 * Execution Guard:
 * Only runs the chat loop if the file is called directly via `bun src/chat.ts`.
 * This allows the integration tests to import the file without hanging.
 */
if (import.meta.main) {
  startChat().catch((err) => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}