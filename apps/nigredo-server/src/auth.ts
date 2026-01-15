import { createRemoteJWKSet, jwtVerify } from 'jose';
import { db } from './db';
import { user } from './schema';
import { eq } from 'drizzle-orm';

// Authentik OAuth endpoints
const AUTHENTIK_BASE_URL = process.env.AUTHENTIK_BASE_URL || 'http://localhost:9000';
const AUTHENTIK_APPLICATION = process.env.AUTHENTIK_APPLICATION || 'nigredo';
const JWKS_URI = `${AUTHENTIK_BASE_URL}/application/o/${AUTHENTIK_APPLICATION}/jwks/`;
const ISSUER = `${AUTHENTIK_BASE_URL}/application/o/${AUTHENTIK_APPLICATION}/`;

// Create JWKS client for token verification
const jwks = createRemoteJWKSet(new URL(JWKS_URI));

export interface AuthentikUser {
  sub: string;
  email: string;
  email_verified: boolean;
  preferred_username: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  groups: string[];
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

/**
 * Verify and decode an Authentik JWT access token
 */
export async function verifyToken(token: string): Promise<AuthentikUser> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
    });

    return {
      sub: payload.sub!,
      email: payload.email as string,
      email_verified: payload.email_verified as boolean,
      preferred_username: payload.preferred_username as string,
      name: payload.name as string | undefined,
      given_name: payload.given_name as string | undefined,
      family_name: payload.family_name as string | undefined,
      groups: (payload.groups as string[]) || [],
      aud: payload.aud as string,
      iss: payload.iss as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check if user is an admin (member of nigredo-admins group)
 */
export function isAdmin(user: AuthentikUser): boolean {
  return user.groups.includes('nigredo-admins');
}

/**
 * Map Authentik groups to local user role
 */
export function mapGroupsToRole(groups: string[]): 'admin' | 'user' {
  if (groups.includes('nigredo-admins')) {
    return 'admin';
  }
  return 'user';
}

/**
 * Sync Authentik user to local database
 * Creates or updates user record
 */
export async function syncUserToDatabase(authentikUser: AuthentikUser): Promise<string> {
  const localUser = await db.query.user.findFirst({
    where: eq(user.email, authentikUser.email)
  });

  const role = mapGroupsToRole(authentikUser.groups);
  const displayName = authentikUser.preferred_username || authentikUser.name || authentikUser.email;

  if (!localUser) {
    // Create new user
    const newUserId = authentikUser.sub;
    await db.insert(user).values({
      id: newUserId,
      email: authentikUser.email,
      name: displayName,
      role: role,
    });
    console.log(`✓ Created new user: ${authentikUser.email} (role: ${role}, ID: ${newUserId})`);
    return newUserId;
  }

  // Update existing user
  await db.update(user)
    .set({
      name: displayName,
      role: role,
    })
    .where(eq(user.email, authentikUser.email));

  console.log(`✓ Synced user: ${authentikUser.email} (role: ${role}, local ID: ${localUser.id})`);
  return localUser.id;
}
