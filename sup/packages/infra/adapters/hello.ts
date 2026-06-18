// packages/infra/adapters/hello.ts
import { serve } from "bun";

serve({
  fetch(req) {
    if (req.url.endsWith("/hello")) {
      return new Response(JSON.stringify({ message: "Hello Nurse SPA!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
  port: 3000,
});

console.log("Hello endpoint running at http://localhost:3000/hello");

