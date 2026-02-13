/**
 * @file chat.test.ts
 * @description Integration test for the CLI loop.
 */

import { test, expect, spyOn, describe, beforeEach, afterEach, mock as bunMock } from "bun:test";
import * as readline from 'node:readline/promises';

// Using @ alias for F500-standard architecture
import * as agentModule from '../../packages/agents/support-agent';
import { startChat } from '../../apps/cli/chat';

describe('Chat CLI Logic', () => {
  
  beforeEach(() => {
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // We use bunMock here because it's the imported namespace from bun:test
    bunMock.restore(); 
  });

  test('CLI loop terminates on "exit"', async () => {
    const mockInterface = {
      // Create a mock function specifically for this instance
      question: bunMock().mockResolvedValueOnce('exit'),
      close: bunMock(),
    };

    spyOn(readline, 'createInterface').mockReturnValue(mockInterface as any);
    const mockAgent = spyOn(agentModule, 'supportAgent');

    await startChat();

    expect(mockInterface.question).toHaveBeenCalledTimes(1);
    expect(mockAgent).not.toHaveBeenCalled();
  });

  test('CLI processes agent steps correctly', async () => {
    const mockInterface = {
      question: bunMock()
        .mockResolvedValueOnce('hi')
        .mockResolvedValueOnce('exit'),
      close: bunMock(),
    };

    spyOn(readline, 'createInterface').mockReturnValue(mockInterface as any);

    const mockAgent = spyOn(agentModule, 'supportAgent').mockImplementation(async function* () {
      yield { type: 'thinking', timestamp: Date.now(), message: 'Thinking...' };
      yield { type: 'final', timestamp: Date.now(), text: 'Hello!' };
    });

    await startChat();

    expect(mockAgent).toHaveBeenCalledWith(
    'hi', 
    expect.objectContaining({
      id: expect.stringMatching(/^cli-session-/),
      events: expect.any(Array)
      })
    );
    expect(mockInterface.question).toHaveBeenCalledTimes(2);
  });
});