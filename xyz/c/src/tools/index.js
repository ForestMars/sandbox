/**
 * Mock tools for customer support agent
 * In production, these would connect to real APIs/databases
 */

export const checkOrderStatus = {
  name: 'check_order_status',
  description: 'Check the status of a customer order by order ID',
  parameters: {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'The order ID to check'
      }
    },
    required: ['orderId']
  },
  execute: async ({ orderId }) => {
    // Mock implementation
    const statuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      orderId,
      status: randomStatus,
      estimatedDelivery: randomStatus === 'shipped' ? '2-3 business days' : 'N/A',
      trackingNumber: randomStatus === 'shipped' ? 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase() : null
    };
  }
};

export const checkInventory = {
  name: 'check_inventory',
  description: 'Check if a product is in stock',
  parameters: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'The product ID to check'
      }
    },
    required: ['productId']
  },
  execute: async ({ productId }) => {
    // Mock implementation
    const inStock = Math.random() > 0.3;
    const quantity = inStock ? Math.floor(Math.random() * 100) + 1 : 0;
    
    return {
      productId,
      inStock,
      quantity,
      nextRestock: !inStock ? 'Expected in 1-2 weeks' : null
    };
  }
};

export const createSupportTicket = {
  name: 'create_support_ticket',
  description: 'Create a support ticket for issues that require human intervention',
  parameters: {
    type: 'object',
    properties: {
      issue: {
        type: 'string',
        description: 'Description of the issue'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Priority level of the ticket'
      }
    },
    required: ['issue', 'priority']
  },
  execute: async ({ issue, priority }) => {
    // Mock implementation
    const ticketId = 'TICK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    return {
      ticketId,
      issue,
      priority,
      status: 'open',
      message: `Support ticket ${ticketId} has been created. A human agent will respond within 24 hours.`
    };
  }
};
