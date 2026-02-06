// src/mastra/tools/order-tools.ts

const DEBUG = true;

export const orderLookupTool = {
  id: 'orderLookupTool',
  description: 'Use this tool to look up order status by ID.',
  execute: async ({ orderId }: { orderId: string }) => {
    if (DEBUG) console.log(`[TOOL] Looking up: ${orderId}`);

    const mockOrders: Record<string, any> = {
      '#12345': { status: 'Shipped', deliveryDate: '2026-02-10' },
      '#67890': { status: 'Processing', deliveryDate: 'TBD' },
    };

    const result = mockOrders[orderId] || { status: 'Not Found', deliveryDate: 'N/A' };

    if (DEBUG) console.log(`[TOOL] Returning:`, result);

    return result;
  },
};