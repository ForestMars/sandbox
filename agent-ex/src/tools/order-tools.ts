// src/tools/order-tools.ts

import { Tool } from '../types/agent-types';

/**
 * Order status information
 */
export interface OrderStatus {
  status: 'Shipped' | 'Processing' | 'Not Found';
  deliveryDate: string;
}

/**
 * Parameters for order lookup
 */
export interface OrderLookupParams {
  orderId: string;
}

const DEBUG = true;

export const orderLookupTool: Tool<OrderLookupParams, OrderStatus> = {
  id: 'order_lookup',
  name: 'Order Lookup',
  description: 'Look up order status by order ID',
  
  async execute({ orderId }: OrderLookupParams): Promise<OrderStatus> {
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