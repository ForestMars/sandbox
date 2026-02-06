import { createAgent } from "@mastra/core";
import {
  lookupAccountTool,
  createSupportTicketTool,
} from "./tools";

export const supportAgent = createAgent({
  id: "customer-support-agent",
  instructions: `
You are a customer support agent.

Your job:
1. Understand the user's problem.
2. If relevant, look up their account.
3. If the problem cannot be resolved immediately, create a support ticket.
4. Respond clearly and concisely.

Do not hallucinate account data.
Always use tools when account or ticket actions are required.
`,
  tools: [
    lookupAccountTool,
    createSupportTicketTool,
  ],
});
