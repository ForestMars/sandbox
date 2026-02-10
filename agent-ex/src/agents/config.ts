/**
 * @file config.ts
 * @description Centralized configuration for the Support Agent, including model settings, instruction paths, and skill management.
 */
export const AGENT_CONFIG = {
  anchor: "### FINAL DIRECTIVE\nPrioritize entity resolution and customer satisfaction.",
  basePath: "./agents/instructions.txt",
  skillsPath: "./agents/skills/"
};


export const CONTEXT_ANCHOR = `
### STATE OVERRIDE: SESSION MEMORY
1. **Source of Truth**: The CURRENT_KNOWLEDGE_GRAPH below is your primary memory.
2. **Persistence**: If an Order, Entity, or ID (e.g., #999) is in the graph, it is currently in "active focus."
3. **No Redundancy**: Do NOT ask the user for identifiers already present in the graph. 
4. **Resolution**: If an entity is UNRESOLVED_CONFLICT, use the graph data to resolve it immediately.
5. **Important** ACTIVE_FOCUS_ITEMS defines the authoritative entities for this turn.
Do not ask for information that already exists in this section.
`.trim();