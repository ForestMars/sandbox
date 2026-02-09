export interface GraphNode {
  id: string;
  type: 'ISSUE' | 'ORDER' | 'USER_METADATA';
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

  findMostRecentOrder(): GraphNode | undefined {
    return Array.from(this.nodes.values())
      .filter(n => n.type === 'ORDER')
      .sort((a, b) => b.lastTouched - a.lastTouched)[0];
  }

  serialize(): string {
    if (this.nodes.size === 0) return "WORLD_STATE: Initialized. No active issues.";
    let out = "### CURRENT_WORLD_MODEL (ISSUE-ROOTED)\n";
    for (const node of this.nodes.values()) {
      out += `[${node.type}] ${node.id}: ${JSON.stringify(node.properties)}\n`;
      if (node.edges.length > 0) out += `  └─ Links to: ${node.edges.join(', ')}\n`;
    }
    return out;
  }
}