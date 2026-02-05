import { createTool } from '@mastra/core';
import { z } from 'zod';

export const orderLookupTool = createTool({
  id: 'get-order-details',
  description: 'Lookup order status by ID',
  inputSchema: z.object({
    orderId: z.string(),
  }),
  execute: async ({ input }) => {
    // Mocking a database response
    return {
      id: input.orderId,
      status: 'In Transit',
      eta: '2026-02-15',
    };
  },
});
