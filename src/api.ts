import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server";
import { env } from "./env";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `http://${env.VITE_BACKEND_ORIGIN}`,
    }),
  ],
});
