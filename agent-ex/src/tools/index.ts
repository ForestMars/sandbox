/**
 * @file index.ts
 * @description Central registry for all support tools.
 */
import { orderLookupTool } from './order-tools';
import { itTicketTool } from './it-tools'; 
// ... other 8 tools

export const toolRegistry = [
  orderLookupTool,
  itTicketTool,
  // ...
];

export type Tool = typeof toolRegistry[number];