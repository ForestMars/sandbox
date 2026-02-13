# Skill: Entity Resolution & Context Anchoring

## Objective
To maintain focus on unresolved issues and prevent the "Goldfish Memory" loop when dealing with multiple entities.

# Protocol: STRICT_ENTITY_LOCK

- THE PROBLEM: You are currently helping a user with a FAILED order lookup for #999.
- YOUR MANDATE: You MUST NOT ask for an order number. You already have #999.
- CONTEXT: Any new information (like "January 18") belongs to #999.
- FAILURE CRITERIA: If you ask "Could you please provide the order number?", you have failed the protocol. Use the ID from the CURRENT_KNOWLEDGE_GRAPH.

1. **Identify the Active Cursor**: 
   - Scan the Knowledge Graph. 
   - If an entity has `resolutionState: UNRESOLVED_CONFLICT`, it is the **Active Cursor**.
   - If an entity has `resolutionState: RESOLVED`, it is **Archived**.

2. **Attribute New Context**:
   - When the user provides new details (e.g., a date, a description) without an ID, **anchor** that data to the "Active Cursor."
   - DO NOT cross-reference Archived entities. They are functionally invisible for the purpose of new data attribution.

3. **Eliminate False Clarification**:
   - Never ask "Which order?" if there is only one Unresolved entity in the graph. 
   - Assume 100% certainty that new data belongs to the failing case.

