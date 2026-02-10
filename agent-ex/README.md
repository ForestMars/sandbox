# Project overview

This repo previously used `Mastra` as a thin orchestration layer around an AI SDK. The codebase has been refactored to call the AI SDK (or a small compatibility wrapper) directly.

## Difference: Mastra vs raw AI SDK `generate` shape

This section documents the key differences between the `Mastra` agent `generate()` result and a raw AI SDK `generate`/`predict` response, and shows how we keep compatibility in this repo.

- **Mastra `Agent.generate()` shape (used by callers in this repo)**:

  - `result.text` (string): the final text reply to return to the user.
  - `result.steps` (array): ordered steps produced during generation. Each step typically includes:
    - `finishReason` (string): why the step ended (e.g., `stop`, `tool`).
    - `text` (string): the model's message for that step.
    - `toolCalls` (array): any tool calls performed during that step with results.

  Example:

  ```json
  {
    "text": "Order #12345 status: Shipped",
    "steps": [
      { "finishReason": "tool", "text": "Called tool entityLookupTool", "toolCalls": [{"toolId":"entityLookupTool","result":{"status":"Shipped"}}] }
    ]
  }
  ```

- **Raw AI SDK `generate` / `predict` shape**:

  - Providers differ, but common shapes are lower-level model responses containing one or more model messages, tokens, reasons for stopping, and optional structured tool-invocation signals. Example minimal shape:

  ```json
  {
    "outputs": [ { "content": "Hello!" } ],
    "usage": { /* token counts */ },
    "model": "qwen2.5"
  }
  ```

  - If using tool-calling, the raw SDK often returns special messages indicating an intent to call a tool (tool name + arguments) which the application must interpret, execute, and then possibly re-call the model with the tool result.

## What this repo does now

- We provide a compatibility `supportAgent.generate()` that returns the Mastra-compatible shape (`text` + `steps`) so existing callers (`src/chat.ts`, `src/test-agent.ts`) need minimal changes.
- Under the hood the `generate()` function should be replaced by direct calls to your chosen SDK (Vercel AI SDK or similar). The wrapper must:
  1. Send messages to the SDK and receive the raw response.
 2. Inspect the response for tool-invocation intents.
3. Execute any matching tool (e.g., `entityLookupTool.execute`) and collect results.
 4. Optionally send a follow-up model call including tool results to produce the final `text`.
 5. Return `{ text, steps }` to match previous behavior.

## Example migration notes

- To replace the shim with the Vercel AI SDK:

  1. Add `@vercel/ai` (or your SDK of choice) to `package.json`.
  2. In `src/agents/support-agent.ts`, call the SDK's `predict`/`generate` with the conversation and instructions.
  3. Parse the SDK response for tool intents, call `entityLookupTool.execute`, and synthesize the final answer.

If you'd like, I can implement the Vercel AI SDK integration and update `supportAgent.generate()` to call it and fully remove the compatibility shim. Want me to proceed with that now?
