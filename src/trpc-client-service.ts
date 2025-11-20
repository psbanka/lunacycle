import type { AppRouter } from "../server/index";
import { createTRPCClient, httpBatchLink } from "@trpc/client"

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "http://localhost:3000/api",
			fetch(input, init) {
				if (init) {
					Object.assign(init, { credentials: `include` })
					return fetch(input, init as RequestInit)
				}
				return fetch(input)
			},
		}),
	],
})