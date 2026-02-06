import { createWorkflow } from "@mastra/core";
import { supportAgent } from "./agent";

export const supportWorkflow = createWorkflow({
  id: "support-workflow",
  steps: [
    {
      id: "handle_user_message",
      agent: supportAgent,
    },
  ],
});
