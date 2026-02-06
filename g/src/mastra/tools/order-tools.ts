import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const DEBUG = true;

export const orderLookupTool = createTool({
  id: 'orderLookupTool',
  description: 'Use this tool to look up order status by ID.',
  inputSchema: z.object({
    orderId: z.string().describe('The order ID, e.g. #12345'),
  }),
  execute: async ({ orderId }) => {
    if (DEBUG) console.log(`[TOOL] Looking up: ${orderId}`);
    
    const mockOrders: Record<string, any> = {
      '#12345': { status: 'Shipped', deliveryDate: '2026-02-10' },
      '#67890': { status: 'Processing', deliveryDate: 'TBD' },
    };
    
    const result = mockOrders[orderId] || { status: 'Not Found', deliveryDate: 'N/A' };
    
    if (DEBUG) console.log(`[TOOL] Returning:`, result);
    
    return result;
  },
});