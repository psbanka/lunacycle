// import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import {
  createBunHttpHandler,
  createBunWSHandler,
  createBunServeHandler,
  CreateBunContextOptions,
} from "trpc-bun-adapter";
import { appRouter } from "./appRouter";

const createContext = (opts: CreateBunContextOptions) => {
  return {};
};

const wsHandler = createBunWSHandler({
  router: appRouter,
  // optional arguments:
  createContext,
  onError: console.error,
  batching: {
    enabled: true,
  },
});

const server = Bun.serve(createBunServeHandler(
  {
    router: appRouter,
    responseMeta(opts: any) {
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
