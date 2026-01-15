import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateBunContextOptions } from "trpc-bun-adapter";
import { verifyToken, isAdmin, syncUserToDatabase, type AuthentikUser } from "./auth";

interface Context {
  user?: AuthentikUser;
  localUserId?: string;
  req: Request;
}

export const createContext = async (opts: CreateBunContextOptions): Promise<Context> => {
  const authHeader = opts.req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { req: opts.req };
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyToken(token);
    const localUserId = await syncUserToDatabase(user);

    return {
      user,
      localUserId,
      req: opts.req
    };
  } catch (error) {
    console.error('Token verification or sync failed:', error);
    return { req: opts.req };
  }
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.localUserId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      localUserId: ctx.localUserId
    }
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!isAdmin(ctx.user)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }

  return next({ ctx });
});
