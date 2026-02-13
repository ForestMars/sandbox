/**
 * @file apps/cli/adapters/styled-output.adapter.ts
 */
import { OutputPort } from '@sup/domain/output-port';

export class StyledOutputAdapter implements OutputPort {
  constructor(
    private inner: OutputPort,
    private flags: { style?: string } // Configuration is INJECTED
  ) {}

  async send(text: string): Promise<void> {
    // The "decider" lives inside the adapter, keeping chat.ts clean
    if (this.flags.style === 'efficient') {
      return this.inner.send(`I'm very efficient!!! ${text}`);
    }
    return this.inner.send(text);
  }
}
