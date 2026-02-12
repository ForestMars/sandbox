const DEBUG = true;
/**
 * @file chat.ts
 * @description Main entry point for the Customer Support Agent CLI.
 * Handles user input via readline and orchestrates the supportAgent generator.
 */
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { OpenFeature, MultiProvider, FirstSuccessfulStrategy } from '@openfeature/server-sdk';
import { z } from 'zod';

import { logger } from '@infra/logger';
import type { AgentStep } from './types/agent-types';
import { supportAgent, supportAgentModelSpec } from '@agents/support-agent';
import { ProtocolResolver } from '@lib/protocol-resolver';
import { adapters } from '@tools';
import { JsonFileProvider } from '@infra/adapters/JsonFileProvider';

const { OutputAdapters } = await import('@agents/adapters/output-adapters');

const providers = [];
if (process.env.POSTHOG_API_KEY) {
  const { PostHogProvider } = await import('@tapico/node-openfeature-posthog');
  const { PostHog } = await import('posthog-node');
  const posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
    host: process.env.POSTHOG_HOST || 'https://app.posthog.com'
  });
  providers.push({ provider: new PostHogProvider({ posthogClient }) });
}
providers.push({ provider: new JsonFileProvider('../../config/flags.json') });

const multiProvider = new MultiProvider(providers, new FirstSuccessfulStrategy());
await OpenFeature.setProviderAndWait(multiProvider);

const fflags = OpenFeature.getClient();

const activeAdapters = [];


/**
 * Main chat loop logic, exported for integration testing.
 * The readline interface is created inside the function to allow for 
 * clean mocking and to prevent top-level sidffects during testing.
 */
export async function startChat() { 
  logger.debug(`Loaded model: ${supportAgentModelSpec}\n`);

  const activeAdapters = (await Promise.all(
    OutputAdapters.map(async (adapter) => 
      await fflags.getBooleanValue(adapter.flagName, false) ? adapter.wrapper : null
    )
  )).filter(Boolean);

  console.log('Active adapters:', activeAdapters.length); // Add this
  console.log('OutputAdapters:', OutputAdapters); // Add this

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

      // Create base generator
      let generator = supportAgent(userInput, session, { 
        resolver: ProtocolResolver, 
        tools: adapters
      });

      // Wrap with active adapters
      for (const adapterFn of activeAdapters) {
        generator = adapterFn(generator);
      }

      // Consume the wrapped generator
      for await (const step of generator) {
        steps.push(step);
        
        if (DEBUG) {
          logger.debug(`\n[${step.type.toUpperCase()}]`, formatStep(step));
        }

        if (step.type === 'final') {
          finalText = step.text;
        }
      }

      logger.info(`\nAgent: ${finalText}\n`);

      if (DEBUG) {
        logger.debug(`[DEBUG] Total steps: ${steps.length}`);
        logger.debug(`[DEBUG] Step sequence: ${steps.map(s => s.type).join(' → ')}\n`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error in agent execution:', errorMessage);
      console.error('Full error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
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
    logger.error('Fatal CLI Error:', err);
    // Panic errors can't be logged. 
    console.error('Full error:', err); 
    console.error('Stack trace:', err.stack); 
    process.exit(1);
  });
}