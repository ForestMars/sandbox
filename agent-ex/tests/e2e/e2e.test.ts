import { test, expect, describe } from 'bun:test';
import { createSupportAgent } from './support-agent';
import { ollama } from 'ai-sdk-ollama';
import { z } from 'zod';

describe('Support Agent E2E Integration', () => {
  // 1. Inject the model (Step 1 & 2 of plan)
  const model = ollama('llama3');

  // 2. Define the tool registry for the F500 rollout (Step 3)
  const f500Tools = {
    lookupInvoice: {
      description: 'Check invoice status',
      parameters: z.object({ id: z.string() }),
      execute: async ({ id }: { id: string }) => ({ id, status: 'Paid' }),
    },
    resetPassword: {
      description: 'Reset user password for a system',
      parameters: z.object({ 
        system: z.enum(['AD', 'VPN', 'SSO']), 
        username: z.string() 
      }),
      execute: async ({ system, username }: { system: string, username: string }) => 
        ({ success: true, msg: `Reset for ${username} on ${system}` }),
    }
  };

  const config = {
    instructions: "You are a tool-agnostic support agent. Use the tools provided.",
    tools: f500Tools
  };

  const agent = createSupportAgent(model, config);

  test('should route to and execute the invoice smoke test tool', async () => {
    const result = await agent.run("What is the status of invoice 12345?");
    
    // Validate the AI SDK actually executed the tool
    expect(result.toolResults).toContainEqual(
      expect.objectContaining({ toolName: 'lookupInvoice', result: { id: '12345', status: 'Paid' } })
    );
    expect(result.text).toContain('12345');
  });

  test('should route to and execute an F500 password reset tool', async () => {
    const result = await agent.run("Reset my VPN password for user 'bjones'");

    expect(result.toolResults).toContainEqual(
      expect.objectContaining({ 
        toolName: 'resetPassword', 
        args: expect.objectContaining({ system: 'VPN', username: 'bjones' }) 
      })
    );
    expect(result.text.toLowerCase()).toContain('reset');
  });
});