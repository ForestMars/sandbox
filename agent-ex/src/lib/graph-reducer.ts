// src/lib/graph-reducer.ts

import { MemoryGraph } from './memory-graph';

export function rebuildGraph(history: Event[]): MemoryGraph {
  const graph = new MemoryGraph();
  
  // Sort by timestamp to ensure we don't have "Time-Travel" bugs
  const sortedHistory = history.sort((a, b) => a.ts - b.ts);

  for (const event of sortedHistory) {
    switch (event.type) {
      case 'USER_SAID':
        // Extract entities and add to graph
        const entities = extractEntities(event.payload); 
        entities.forEach(e => graph.addNode(e));
        break;
      
      case 'ORACLE_NOT_FOUND':
        // Update the 'Order' node state to 'Deleted'
        graph.updateNode(event.payload.id, { status: 'DELETED' });
        break;

      case 'DATA_RECONCILE':
        // Link the 'Green Sweater' to 'Order 999' in the Graph
        graph.addEdge(event.payload.orderId, event.payload.itemId);
        break;
    }
  }
  return graph;
}
