import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./appRouter";
import { createContext } from "./trpc";

const PORT = process.env.PORT || 3001;

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    // Handle CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Handle TRPC requests
    if (request.url.includes("/api")) {
      const response = await fetchRequestHandler({
        endpoint: "/api",
        req: request,
        router: appRouter,
        createContext,
      });

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    // Health check endpoint
    if (request.url.endsWith("/health")) {
      return new Response(JSON.stringify({ status: "ok", app: "nigredo-server" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Nigredo Server", { status: 200 });
  },
});

console.log(`🌑 Nigredo server running on http://localhost:${PORT}`);
console.log(`📡 TRPC API available at http://localhost:${PORT}/api`);
