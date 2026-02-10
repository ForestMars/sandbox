/**
 * @file index.ts
 * @description Central registry for all support tools.
 */
import { entityLookupTool } from './order-tools';
import { itTicketTool } from './it-tools'; 
// ... other 8 tools

export const toolRegistry = [
  entityLookupTool,
  itTicketTool,
  // ...
];

export type Tool = typeof toolRegistry[number];