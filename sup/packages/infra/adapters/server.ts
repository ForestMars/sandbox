// packages/infra/adapters/server.ts
import { serve } from "bun";
import fs from "fs";
import path from "path";

const distDir = path.join(import.meta.dir, "../../../apps/bedside");

serve({
  fetch(req) {
    const url = new URL(req.url);

    // Minimal backend endpoint
    if (url.pathname === "/hello") {
      return new Response(JSON.stringify({ message: "Hello Nurse SPA!" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve SPA files
    let filePath = path.join(distDir, url.pathname.slice(1));
    if (url.pathname === "/") filePath = path.join(distDir, "index.html");

    if (!fs.existsSync(filePath)) return new Response("Not Found", { status: 404 });

    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1);
    const contentType = {
      js: "application/javascript",
      css: "text/css",
      html: "text/html",
    }[ext] || "text/plain";

    return new Response(content, { headers: { "Content-Type": contentType } });
  },
  port: 3000,
});

console.log("Bun server running on http://localhost:3000");
