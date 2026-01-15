import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../nigredo-server/src/appRouter";

function getAccessToken(): string | null {
  return localStorage.getItem('authentik_access_token');
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/api',
      headers() {
        const token = getAccessToken();
        return token ? {
          authorization: `Bearer ${token}`,
        } : {};
      },
    }),
  ],
});
