/**
 * @file memory-graph.ts
 * @description In-memory graph data structure for the Agent's World Model.
 * Acts as the derived state in the Event-Sourced architecture.
 * @module lib/memory-graph
 */

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, any>;
  edges: string[]; // List of connected Node IDs
}

export class MemoryGraph {
  public nodes: Map<string, GraphNode> = new Map();

  /**
   * Adds or updates a node in the graph
   */
  setNode(id: string, type: string, properties: Record<string, any> = {}) {
    const existing = this.nodes.get(id);
    this.nodes.set(id, {
      id,
      type,
      properties: { ...existing?.properties, ...properties },
      edges: existing?.edges || []
    });
  }

  /**
   * Connects two nodes
   */
  addEdge(sourceId: string, targetId: string) {
    const source = this.nodes.get(sourceId);
    if (source && !source.edges.includes(targetId)) {
      source.edges.push(targetId);
    }
  }

  /**
   * Flattens the graph into a string so the LLM can "see" it
   */
  serialize(): string {
    if (this.nodes.size === 0) return "Graph is empty.";
    
    let out = "Current Knowledge Graph:\n";
    for (const node of this.nodes.values()) {
      out += `- [${node.type}] ${node.id}: ${JSON.stringify(node.properties)}\n`;
      if (node.edges.length > 0) {
        out += `  -> Connections: ${node.edges.join(', ')}\n`;
      }
    }
    return out;
  }
}