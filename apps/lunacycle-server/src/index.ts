import {
  createBunWSHandler,
  createBunServeHandler,
} from "trpc-bun-adapter";
import { appRouter } from "./appRouter";
import { createContext } from "./trpc";

const wsHandler = createBunWSHandler({
  router: appRouter,
  createContext,
  onError: console.error,
  batching: {
    enabled: true,
  },
});

const server = Bun.serve(createBunServeHandler(
  {
    router: appRouter,
    responseMeta(opts: unknown) {
      return {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:8080",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
      };
    },
    endpoint: "/api",
    createContext,
    batching: { enabled: true },
    emitWsUpgrades: true,
    wsHandler,
  },
  {
    port: 3000,
  }
));

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
