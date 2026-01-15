import type { AppRouter } from "../server/index";
import {
  createTRPCClient,
  httpBatchLink,
  splitLink,
  createWSClient,
  wsLink,
} from "@trpc/client";

// Get access token from localStorage
function getAccessToken(): string | null {
  return localStorage.getItem('authentik_access_token');
}

const wsClient = createWSClient({
  url: "ws://localhost:3000/api",
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: wsLink({ client: wsClient }),
      false: httpBatchLink({
        url: "http://localhost:3000/api",
        headers() {
          const token = getAccessToken();
          return token ? {
            authorization: `Bearer ${token}`,
          } : {};
        },
        fetch(input, init) {
          if (init) {
            Object.assign(init, { credentials: `include` });
            return fetch(input, init as RequestInit);
          }
          return fetch(input);
        },
      }),
    }),
  ],
});