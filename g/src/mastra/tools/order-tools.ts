import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const orderLookupTool = createTool({
  // Make sure this ID matches what the agent expects! 
  id: 'orderLookupTool',
  // Make the description an aggressive command for local models
  // description: 'MANDATORY: Use this tool whenever a user provides an order ID or asks for order status.',
  description: 'Use this tool to look up order status by ID.',
  inputSchema: z.object({
    // Use .describe() to help the model identify the parameter
    orderId: z.string().describe('The order ID, e.g. #12345'),
  }),

  // Mastra 1.0 Signature: execute: async (inputData, context)
  execute: async ({ orderId }) => {
    // This log is your proof that the model is actually working
    console.log(`\n[TOOL] Executing lookup for ID: ${orderId}\n`);

    // Mock data for testing
    const mockOrders: Record<string, any> = {
      '#12345': { status: 'Shipped', deliveryDate: '2026-02-10' },
      '#67890': { status: 'Processing', deliveryDate: 'TBD' },
    };

    const order = mockOrders[orderId] || { status: 'Not Found', deliveryDate: 'N/A' };

    return order;
  },
});