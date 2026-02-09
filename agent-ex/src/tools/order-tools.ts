import { z } from 'zod';
// If you have a specific Tool type in your types, keep it, 
// but AI SDK usually expects this schema:

export const OrderLookupSchema = z.object({
  orderId: z.string().describe("The order or invoice ID (e.g., '12345' or '999')")
});

export const orderLookupTool = {
  id: 'invoice-status-lookup',
  description: 'Look up order/invoice status in the central Oracle database.',
  parameters: OrderLookupSchema,
  
  execute: async ({ orderId }: { orderId: string }) => {
    // Normalize ID
    const id = orderId.replace(/^#/, '');
    
    const mockOrders: Record<string, any> = {
      '12345': { status: 'Shipped', deliveryDate: '2026-02-10' },
      '67890': { status: 'Processing', deliveryDate: 'TBD' },
    };

    const result = mockOrders[id];

    if (!result) {
      return {
        status: 'Not Found',
        deliveryDate: 'N/A',
        // Semantic Anchor: This prevents the Agent from merging this 
        // failed node with other successful entities.
        resolutionState: 'UNRESOLVED_CONFLICT',
        _error_context: `Order ${id} does not exist in the primary database.`
      };
    }

    return {
      ...result,
      resolutionState: 'RESOLVED'
    };
  },
};