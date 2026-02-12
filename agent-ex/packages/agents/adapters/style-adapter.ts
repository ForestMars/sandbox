/**
 * @file /packages/agents/src/adapters/style.adapter.ts
 * @description Decorator for the Agent's AsyncGenerator. 
 * Intercepts the 'final' step to inject test-style formatting.
 */
import type { AgentStep } from '../types/agent-types'; // Adjust based on your actual path

/**
 * Intercepts the supportAgent generator and prepends the test string.
 * @param {AsyncGenerator<AgentStep>} stream - The raw agent generator.
 */
export async function* efficientStyleAdapter(
  stream: AsyncGenerator<AgentStep, void, unknown>
): AsyncGenerator<AgentStep, void, unknown> {
  for await (const step of stream) {
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
