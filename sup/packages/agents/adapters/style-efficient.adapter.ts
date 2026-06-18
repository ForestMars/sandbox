/**
 * @file /src/agents/adapters/efficient-style.adapter.ts
 * @description Output Decorator for the Support Agent. Intercepts the AsyncGenerator 
 * stream to inject style-specific formatting (e.g., "Efficient" mode) into the 
 * final inference step.
 * * @module @agents/adapters
 */
import type { AgentStep } from '@types/agent-types';

/**
 * EFFICIENT ADAPTER: Wraps the core generator to inject the style.
 */
export async function* efficientStyleGenerator(
  generator: AsyncGenerator<AgentStep, void, unknown>
): AsyncGenerator<AgentStep, void, unknown> {
  for await (const step of generator) {
    if (step.type === 'final' && step.text) {
      yield {
        ...step,
        text: `I'm very efficient!!! ${step.text}`
      };
    } else {
      yield step;
    }
  }
}