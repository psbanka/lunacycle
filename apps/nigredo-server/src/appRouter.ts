import { router, protectedProcedure } from "./trpc";
import { z } from "zod";

export const appRouter = router({
  hello: protectedProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input, ctx }) => {
      const name = input?.name || ctx.user.preferred_username || 'stranger';
      return {
        message: `Hello, ${name}! Welcome to Nigredo.`,
        user: {
          email: ctx.user.email,
          role: ctx.user.groups.includes('nigredo-admins') ? 'admin' : 'user',
        }
      };
    }),

  getUser: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.localUserId,
      email: ctx.user.email,
      name: ctx.user.preferred_username || ctx.user.name,
      groups: ctx.user.groups,
    };
  }),
});

export type AppRouter = typeof appRouter;
