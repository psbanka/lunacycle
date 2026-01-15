import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateBunContextOptions } from "trpc-bun-adapter";
import { verifyToken, isAdmin, syncUserToDatabase, type AuthentikUser } from "./auth";

/**
 * Context for TRPC procedures
 * Contains the authenticated user information if available
 */
interface Context {
  user?: AuthentikUser;    // Authentik identity (from JWT token)
  localUserId?: string;     // Local database user ID (for queries)
  req: Request;
}

/**
 * Create context for each request
 * Extracts and verifies the Bearer token from Authorization header
 * Syncs Authentik user to local database
 */
export const createContext = async (opts: CreateBunContextOptions): Promise<Context> => {
  const authHeader = opts.req.headers.get('authorization');

  // Check for Bearer token
  if (!authHeader?.startsWith('Bearer ')) {
    return { req: opts.req };
  }

  // Extract token (remove "Bearer " prefix)
  const token = authHeader.substring(7);

  try {
    // Verify and decode the token
    const user = await verifyToken(token);

    // Sync user to local database and get local user ID
    // This bridges Authentik identity with local app data (task assignments, etc.)
    const localUserId = await syncUserToDatabase(user);

    return {
      user,        // Authentik identity (for authorization)
      localUserId, // Local DB ID (for queries)
      req: opts.req
    };
  } catch (error) {
    // Log verification failure for debugging
    console.error('Token verification or sync failed:', error);
    // Return context without user (unauthenticated)
    return { req: opts.req };
  }
};

// Initialize TRPC with context
const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;

/**
 * Public procedure - no authentication required
 * Use sparingly, most endpoints should require authentication
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 * Throws UNAUTHORIZED error if user is not authenticated
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.localUserId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  // Pass user and localUserId to next middleware/resolver
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      localUserId: ctx.localUserId
    }
  });
});

/**
 * Admin procedure - requires authentication AND admin role
 * Throws UNAUTHORIZED if not authenticated
 * Throws FORBIDDEN if authenticated but not an admin
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if user is an admin (member of lunacycle-admins group)
  if (!isAdmin(ctx.user)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }

  return next({ ctx });
});
