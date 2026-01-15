import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server";
import { env } from "./env";

// Get access token from localStorage
function getAccessToken(): string | null {
  return localStorage.getItem('authentik_access_token');
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `http://${env.VITE_BACKEND_ORIGIN}/api`,
      headers() {
        const token = getAccessToken();
        return token ? {
          authorization: `Bearer ${token}`,
        } : {};
      },
    }),
  ],
});
