/**
 * @file graph-reducer.ts
 * @description Reducer that projects an append-only event log into a MemoryGraph.
 */

import { MemoryGraph } from './memory-graph';
import type { AgentEvent } from '@/types/agent-types';

export function rebuildGraph(history: AgentEvent[]): MemoryGraph {
  const graph = new MemoryGraph();
  
  // Clone to avoid mutating the source of truth
  const events = [...history].sort((a, b) => a.timestamp - b.timestamp);

  for (const event of events) {
    switch (event.type) {
      case 'USER_UPDATE':
        // 1. Identify what the user is talking about
        // We look for the most recently touched Order in the graph
        const activeOrder = graph.findMostRecentNode('ORDER');
        
        // 2. The "Subnet Link": If an order failed, attach this text to it
        if (activeOrder && activeOrder.properties.status === 'Not Found') {
          graph.setNode(activeOrder.id, 'ORDER', {
            description: (activeOrder.properties.description || '') + ' ' + event.payload.text
          });
        }
        break;
      
      case 'TOOL_RESULT':
        if (event.payload.result.status === 'Not Found') {
          graph.setNode(event.payload.orderId, 'ORDER', { 
            status: 'MISSING_IN_ORACLE', // Use a high-signal status
            needsEscalation: true 
          });
        }
        break;
    }
  }

  return graph;
}