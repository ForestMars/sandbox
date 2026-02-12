import { entityLookupTool } from './order-tools';
import type { ToolAdapterPort } from '@/domain/expertise.types';

// Simple adapter that forwards to the concrete tool implementation.
export const entityLookupAdapter: ToolAdapterPort & { execute: (args: { entityId: string }) => Promise<any> } = {
  execute: async ({ entityId }: { entityId: string }) => {
    return entityLookupTool.execute({ entityId });
  }
};

export const adapters: Record<string, typeof entityLookupAdapter> = {
  'entity-status-lookup': entityLookupAdapter,
  'invoice-status-lookup': entityLookupAdapter,
  'invoice-status': entityLookupAdapter,
  'order-lookup': entityLookupAdapter,
  'entity-lookup': entityLookupAdapter,
};

export default adapters;
