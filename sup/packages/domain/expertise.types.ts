/**
 * Domain types for expertise and protocol resolution.
 */
export interface Protocol {
  key?: string;
  name?: string;
  skillPath: string;
  tools: any[];
  styleOverride?: string;
  priority?: number;
}

export interface ExpertStrategy {
  key: string;
  skillPath: string;
  tools: any[];
  rules?: string;
  systemPrompt?: string;
  name?: string;
}

export interface ExpertiseResolverPort {
  resolve(context: string): ExpertStrategy;
}

export interface ToolAdapterPort {
  // standardized tool interaction interface
}
