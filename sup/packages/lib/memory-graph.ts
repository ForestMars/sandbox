/**
 * @file memory-graph.ts
 * @description In-Memory Graph Representation for Agent's World Model.
 */

export interface GraphNode {
  id: string;
  type: 'ISSUE' | 'ENTITY' | 'USER_METADATA';
  properties: Record<string, any>;
  edges: string[]; 
  lastTouched: number;
}

export class MemoryGraph {
  public nodes: Map<string, GraphNode> = new Map();

  setNode(id: string, type: GraphNode['type'], properties: Record<string, any> = {}) {
    const existing = this.nodes.get(id);
    this.nodes.set(id, {
      id,
      type,
      properties: { ...existing?.properties, ...properties },
      edges: existing?.edges || [],
      lastTouched: Date.now()
    });
  }

  addEdge(sourceId: string, targetId: string) {
    const source = this.nodes.get(sourceId);
    if (source && !source.edges.includes(targetId)) {
      source.edges.push(targetId);
    }
  }

  findActiveIssue(): GraphNode | undefined {
    return Array.from(this.nodes.values())
      .find(n => n.type === 'ISSUE' && n.properties.status === 'OPEN');
  }

  findMostRecentEntity(): GraphNode | undefined {
    return Array.from(this.nodes.values())
      .filter(n => n.type === 'ENTITY')
      .sort((a, b) => b.lastTouched - a.lastTouched)[0];
  }

  serialize(): string {
    let out = "### KNOWLEDGE_GRAPH_STATE\n";
    const nodes = Array.from(this.nodes.values());

    // Separate active issues from archived history
    const activeNodes = nodes.filter(n => n.properties.resolutionState !== 'RESOLVED');
    const archivedNodes = nodes.filter(n => n.properties.resolutionState === 'RESOLVED');

    if (activeNodes.length > 0) {
      out += ">> ACTIVE_FOCUS_ITEMS:\n";
      activeNodes.forEach(n => {
        out += ` - [${n.type}] ID: ${n.id} | STATE: ${n.properties.resolutionState} | CONTEXT: ${n.properties.context || 'None'}\n`;
      });
    }

    if (archivedNodes.length > 0) {
      out += ">> ARCHIVED_HISTORY (DO NOT RE-OPEN):\n";
      archivedNodes.forEach(n => out += ` - ${n.type} ${n.id}: RESOLVED\n`);
    }
  
  return out;
}
}