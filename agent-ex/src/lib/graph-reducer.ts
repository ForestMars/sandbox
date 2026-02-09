import { MemoryGraph } from './memory-graph';
import type { AgentEvent } from '@/types/agent-types';

export function rebuildGraph(history: AgentEvent[]): MemoryGraph {
  const graph = new MemoryGraph();
  
  // Sort events to ensure we project state in the correct chronological order
  const events = [...history].sort((a, b) => a.timestamp - b.timestamp);

  for (const event of events) {
    switch (event.type) {
      case 'USER_UPDATE':
        const text = event.payload.text;
        
        // 1. PROACTIVE EXTRACTION
        // Scan for ID patterns (e.g., #999 or 12345) to create the node immediately.
        // This ensures the graph isn't empty when the LLM gets its first prompt.
        const idMatch = text.match(/#?(\d{3,})/);
        if (idMatch) {
          const extractedId = idMatch[1];
          graph.setNode(extractedId, 'ORDER', { 
            status: 'PENDING_LOOKUP' 
          });
        }

        // 2. CONTEXTUAL LINKING
        // Find the "Active" node we are currently talking about.
        const activeOrder = graph.findMostRecentNode('ORDER');

        if (activeOrder) {
          const currentDesc = activeOrder.properties.description || '';
          graph.setNode(activeOrder.id, 'ORDER', {
            description: `${currentDesc} ${text}`.trim()
          });
        }
        break;

      case 'TOOL_RESULT':
        // Update the graph with hard data from the Oracle database
        const { orderId, result } = event.payload;
        graph.setNode(orderId, 'ORDER', {
          ...result,
          // Explicitly carry over properties the tool might return (e.g. status)
        });
        break;
    }
  }
  return graph;
}