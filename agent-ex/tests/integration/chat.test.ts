/**
 * @file chat.test.ts
 * @description Unit tests for the CLI chat entry point.
 * Mocks readline and the supportAgent generator to verify the UI loop.
 */

import { test, expect, spyOn, describe, beforeEach, afterEach } from "bun:test";
import * as readline from 'node:readline/promises';
import { supportAgent } from '@/agents/support-agent';

// We need to mock the supportAgent module
// In Bun, we can mock the exported function
const mockAgent = spyOn(require('@/agents/support-agent'), 'supportAgent');

describe('Chat CLI Logic', () => {
  let mockQuestion: any;

  beforeEach(() => {
    // Mocking the console to keep test output clean
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'error').mockImplementation(() => {});
  });

  test('CLI loop terminates on "exit"', async () => {
    // 1. Mock readline to return "exit" immediately
    mockQuestion = spyOn(readline.promises.Interface.prototype, 'question')
      .mockResolvedValueOnce('exit');

    // Import startChat (we might need to export it from chat.ts first)
    // For this test to work without hanging, startChat must be exported
    const { startChat } = require('./chat');
    
    await startChat();

    expect(mockQuestion).toHaveBeenCalledTimes(1);
    expect(mockAgent).not.toHaveBeenCalled();
  });

  test('CLI processes agent steps correctly', async () => {
    // 1. Mock user input: "hi", then "exit"
    mockQuestion = spyOn(readline.promises.Interface.prototype, 'question')
      .mockResolvedValueOnce('hi')
      .mockResolvedValueOnce('exit');

    // 2. Mock the generator response for "hi"
    mockAgent.mockImplementation(async function* () {
      yield { type: 'thinking', timestamp: Date.now(), message: 'Thinking...' };
      yield { type: 'final', timestamp: Date.now(), text: 'Hello there!' };
    });

    const { startChat } = require('./chat');
    await startChat();

    expect(mockAgent).toHaveBeenCalledWith('hi');
    // Verify it asked the second question (the "exit" trigger)
    expect(mockQuestion).toHaveBeenCalledTimes(2);
  });
});