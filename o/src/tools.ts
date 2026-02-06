import { createTool } from "@mastra/core";

export const lookupAccountTool = createTool({
  id: "lookup_account",
  description: "Lookup a customer account by email",
  inputSchema: {
    email: "string",
  },
  execute: async ({ email }) => {
    return {
      email,
      plan: "Pro",
      status: "active",
    };
  },
});

export const createSupportTicketTool = createTool({
  id: "create_support_ticket",
  description: "Create a support ticket for unresolved issues",
  inputSchema: {
    email: "string",
    issue: "string",
  },
  execute: async ({ email, issue }) => {
    return {
      ticketId: "TICKET-1234",
      status: "created",
      issue,
    };
  },
});
