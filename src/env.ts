import { createEnv } from "@t3-oss/env-core"
import { type } from "arktype"

export const BUILDING_WITH_VITE = `__vite_start_time` in globalThis
export const HAS_WINDOW = typeof window !== `undefined`
export const IS_TEST = `vitest` in globalThis

const str = type(`string`)
const maybeBool = type(`"true" | "false" | undefined`)

export const env = createEnv({
	isServer: !BUILDING_WITH_VITE && !HAS_WINDOW,

	server: {
		CI: type(`string | undefined`).pipe(Boolean),
		BACKEND_PORT: str.pipe((s) => Number.parseInt(s, 10)),
		FRONTEND_PORT: str.pipe((s) => Number.parseInt(s, 10)),
		FRONTEND_ORIGINS: str.pipe.try((s) => JSON.parse(s), type(`string[]`)),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: `VITE_`,

	client: {
		// includes the port
		VITE_BACKEND_ORIGIN: str,
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: import.meta.env,
})