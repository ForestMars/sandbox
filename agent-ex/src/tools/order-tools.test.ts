/**
 * @file order-tools.test.ts
 * @description Unit tests for the Order Lookup tool. 
 * Validates ID normalization, mock data retrieval, and error handling.
 * @module tools/order-tools.test
 */

import { test, expect, describe } from 'bun:test';
import { entityLookupTool } from './order-tools';

describe('entityLookupTool', () => {
  
  /**
   * Verified: The tool correctly retrieves existing records.
   */
  test('returns "Shipped" for ID 12345', async () => {
    const result = await entityLookupTool.execute({ entityId: '12345' });
    expect(result.status).toBe('Shipped');
  });

  /**
   * Verified: Users often input "#12345". The tool must strip the symbol.
   */
  test('normalizes IDs containing the "#" symbol', async () => {
    const result = await entityLookupTool.execute({ entityId: '#12345' });
    expect(result.status).toBe('Shipped');
  });

  /**
   * Verified: Graceful failure when an ID is missing from the mock DB.
   */
  test('returns "Not Found" for unregistered IDs', async () => {
    const result = await entityLookupTool.execute({ entityId: '999' });
    expect(result.status).toBe('Not Found');
    expect(result.deliveryDate).toBe('N/A');
  });
});