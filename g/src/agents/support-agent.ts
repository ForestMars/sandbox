// src/tools/order-tools.ts

const DEBUG = true;

/**
 * Order status information
 */
interface OrderStatus {
  status: string;
  deliveryDate: string;
}

/**
 * Parameters for order lookup
 */
interface OrderLookupParams {
  orderId: string;
}

/**
 * Tool definition for looking up order status
 */
interface OrderLookupTool {
  id: string;
  description: string;
  execute: (params: OrderLookupParams) => Promise<OrderStatus>;
}

export const orderLookupTool: OrderLookupTool = {
  id: 'order_lookup',
  description: 'Use this tool to look up order status by ID.',
  execute: async ({ orderId }: OrderLookupParams): Promise<OrderStatus> => {
    if (DEBUG) console.log(`[TOOL] Looking up: ${orderId}`);

    const mockOrders: Record<string, OrderStatus> = {
      '12345': { status: 'Shipped', deliveryDate: '2026-02-10' },
      '67890': { status: 'Processing', deliveryDate: 'TBD' },
    };

    // Normalize order ID by removing # prefix if present
    const normalizedId = orderId.replace(/^#/, '');
    const result: OrderStatus = mockOrders[normalizedId] || { 
      status: 'Not Found', 
      deliveryDate: 'N/A' 
    };

    if (DEBUG) console.log(`[TOOL] Returning:`, result);

    return result;
  },
};