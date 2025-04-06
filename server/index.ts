import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { TRPCError } from "@trpc/server";
import { defaultScenario } from "./defaultScenario.ts";
import { login } from "./login.ts";
import cors from 'cors';

const appRouter = router({
  login,
  userList: publicProcedure.query(async () => {
    const users = await db.user.getAll();
    return users;
  }),
  userById: publicProcedure
    .input(type({ id: "string" }))
    .query(async ({ input }) => {
      const response = await db.user.findFirst({
        where: { id: { equals: input.id } },
      });
      if (!response) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return { ...response, passwordHash: undefined };
    }),
  userCreate: publicProcedure
    .input(type({ name: "string", email: "string" }))
    .mutation(async (options) => {
      const { name, email } = options.input;
      const user = await db.user.create({ name, email });
      return user;
    }),
});

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext() {
    console.log('context 3');
    return {};
  },
});

console.log("Seeding the database...");
defaultScenario(db);
console.log("Listening on http://localhost:3000");
server.listen(3000);

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
