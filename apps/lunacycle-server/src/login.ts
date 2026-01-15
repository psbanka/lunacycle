import { publicProcedure } from "./trpc.ts";
import { compare } from "@node-rs/bcrypt";
import { type } from "arktype";
import { db } from "./db.ts";
import { TRPCError } from "@trpc/server";
import { AccessToken } from "@lunacycle/types";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { fakerEN } from "@faker-js/faker";

export const login = publicProcedure
  .input(type({ email: "string", password: "string" }))
  .mutation(async ({ input }) => handleLogin(input));

const BASIC_ACCESS_TOKEN = AccessToken({
  exp: 1698253737,
  iat: 1698253437,
  auth_time: 1698253402,
  jti: "c1276d51-6679-4c90-9690-9165223742b2",
  iss: "https://accounts.arcticfox.net/realms/arcticfox",
  aud: "https://api.acticfox.net/",
  sub: "c87b2d97-c3b1-43fd-9724-c54676abed7d",
  typ: "Bearer",
  azp: "manage-arcticfox-net",
  session_state: "a1eb1b21-97de-4783-b87e-62074ee24e73",
  acr: "default",
  "allowed-origins": ["", "https://www.arcticfox.com", "http://localhost:4200"],
  scope: "openid email profile api_audience customer_role",
  sid: "a1eb1b21-97de-4783-b87e-62074ee24e73",
  email_verified: true,
  role: "admin",
  user_id: "4tCK0GYXwVFX9Bh0y5T8j3",
  preferred_username: "test admin",
  email: "testadmin@arcticfox.net",
});

function base64UrlEncode(input: string): string {
  const base64 = btoa(input);
  return base64.replace("+", "-").replace("/", "_").replace(/=+$/, "");
}

/**
 * lifted from oidc-client-ts, which does not export it
 * @param codeVerifier secret that is turned into a hash
 * @returns hashed and cleaned-up challenge
 */
export async function generateCodeChallenge(codeVerifier: string) {
  // https://github.com/authts/oidc-client-ts/blob/2bc232101510d8836571b07f622bb81ed216b63d/src/utils/CryptoUtils.ts#L48-L63
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const binary = [...new Uint8Array(digest)]
    .map((c) => String.fromCharCode(c))
    .join("");
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function encodeJwt(
  payload: typeof AccessToken.infer
): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const encodedSignature = await generateCodeChallenge(
    encodedHeader + "." + encodedPayload
  );
  return encodedHeader + "." + encodedPayload + "." + encodedSignature;
}

type AccessTokenConfig = {
  userId: string,
  name: string,
  email: string,
  iat: number,
  exp: number,
  authTime: number,
}
async function generateAccessToken(
  savedAccessToken: AccessTokenConfig
) {
  if (!savedAccessToken.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  }
  const accessToken = AccessToken({
    ...BASIC_ACCESS_TOKEN,
    jti: fakerEN.string.uuid(),
    sub: savedAccessToken.userId,
    iss: "https://accounts.arcticfox.com/realms/arctic-fox",
    aud: "https://api.arcticfox.com/",
    typ: "Bearer",
    azp: "arctic-fox",
    acr: "default",
    "allowed-origins": ["*"],
    exp: savedAccessToken.exp,
    iat: savedAccessToken.iat,
    auth_time: savedAccessToken.iat,
    preferred_username: savedAccessToken.name,
    email: savedAccessToken.email,
  });
  if (accessToken instanceof type.errors) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  }
  return accessToken;
}

async function handleLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  console.log(`email: ${email}, password: ${password}`);
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, email),
  });
  if (user == null || user.passwordHash == null) {
    console.log('no user');
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  }
  const validPassword = await compare(password, user.passwordHash);

  console.log('bad password apparently')
  if (!validPassword) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  }
  console.log("handleLogin ------------LOGGED IN-------------------------- ");
  const now = new Date();
  const accessToken = await generateAccessToken({
    userId: user.id,
    name: user.name,
    email: user.email,
    iat: now.getTime(),
    exp: now.getTime() + 90 * 24 * 60 * 60 * 1000,
    authTime: now.getTime(),
  })
  const encodedAccessToken = await encodeJwt(accessToken);
  /*
  db.insert(schema.savedAccessToken).values({
    encodedAccessToken,
  }).run();
  */
  return { user, accessToken: encodedAccessToken };
}
