# Skill: Entity Resolution & Context Anchoring

## Objective
To maintain focus on unresolved issues and prevent the "Goldfish Memory" loop when dealing with multiple entities.

## Protocol
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
