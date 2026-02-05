import { supportWorkflow } from "./workflow";

async function run() {
  const response = await supportWorkflow.run({
    input: {
      messages: [
        {
          role: "user",
          content: "I can't access my account, my email is user@example.com",
        },
      ],
    },
  });

  console.log(response.output.messages.at(-1)?.content);
}

run();
