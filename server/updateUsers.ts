import { db } from "./db.ts";
import { eq, isNull } from "drizzle-orm";
import * as schema from "./schema";
import { TRPCError } from "@trpc/server";
import { fetchRandomAvatar } from "./avatarUtils.ts";
import { type } from "arktype";
import { hash } from "@node-rs/bcrypt";

export const UserUpdate = type({
  id: "string",
  name: "string",
  role: "string",
  email: "string",
  "password?": "string",
})

export async function generateNewAvatar(userId: string) {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  });
  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }
  // TODO: Make this boy/girl relevant
  const avatar = await fetchRandomAvatar(user.email);
  db.update(schema.user)
    .set({ avatar })
    .where(eq(schema.user.id, userId))
    .run();
  const updatedUser = db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  });
  return updatedUser;
}

export async function updateAvatar({ userId, file }: {userId: string, file: string}) {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  });
  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }
  db.update(schema.user)
    .set({ avatar: file })
    .where(eq(schema.user.id, userId))
    .run();
  return { success: true };
}

export async function updateUser(input: typeof UserUpdate.infer) {
  let update: Partial<schema.User> | null = null
  if (input.password) {
    const passwordHash = await hash(input.password, 10);
    update = {
      id: input.id,
      name: input.name,
      role: input.role,
      email: input.email,
      passwordHash,
    };
  } else {
    update = {
      id: input.id,
      name: input.name,
      role: input.role,
      email: input.email
    }
  }
  // TODO: Check the user ID of the person who is logged in
  db.update(schema.user)
    .set({ ...update })
    .where(eq(schema.user.id, input.id))
    .run();

  return await db.query.user.findFirst({
    where: eq(schema.user.id, input.id),
  });
}