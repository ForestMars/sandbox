// apps/cli/adapters.ts
import type { AgentStep } from '@sup/agents/types';

export async function* efficientStyle(
  stream: AsyncGenerator<AgentStep, void, unknown>
): AsyncGenerator<AgentStep, void, unknown> {
  for await (const step of stream) {
    if (step.type === 'final' && step.text) {
      yield { ...step, text: `I'm very efficient!!! ${step.text}` };
    } else {
      yield step;
    }
  }
}
