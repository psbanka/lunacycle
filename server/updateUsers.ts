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
});

export async function generateNewAvatar() {
  // TODO: Make this gender-relevant
  const avatar = await fetchRandomAvatar();
  return avatar;
}

export async function updateAvatar({
  userId,
  file,
}: {
  userId: string;
  file: string;
}) {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  });
  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }
  db.update(schema.userProfile)
    .set({ avatar: file })
    .where(eq(schema.user.id, userId))
    .run();
  return { success: true };
}

export async function updateUser(input: typeof UserUpdate.infer) {
  let update: Partial<schema.User> | null = null;
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
      email: input.email,
    };
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

export async function addUser(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const existingUser = await db.query.user.findFirst({
    where: eq(schema.user.email, input.email),
  });
  if (existingUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "User already exists",
    });
  }

  const passwordHash = await hash(input.password, 10);
  const id = crypto.randomUUID();
  const user = db
    .insert(schema.user)
    .values({
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash,
    })
    .returning()
    .run();

  const avatar = await generateNewAvatar();
  db.insert(schema.userProfile)
    .values({
      userId: id,
      avatar,
    })
    .run();
  return { success: true };
}

/*
export async function addUser(input: { name: string, email: string, password: string }) {
  await db.insert(schema.user)
    .values({
      name: input.name,
      email: input.email,
      passwordHash: await hash(input.password, 10),
    })
    .run();
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, input.email),
    });
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    const avatar = await generateNewAvatar();
    db.insert(schema.userProfile)
      .values({
        userId: user.id,
        avatar,
      })
      .run();
    return { success: true };
}
    */
