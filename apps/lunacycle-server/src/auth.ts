import { createRemoteJWKSet, jwtVerify } from 'jose';
import { db } from './db';
import { user } from './schema';
import { eq } from 'drizzle-orm';

// Authentik OAuth endpoints
const AUTHENTIK_BASE_URL = process.env.AUTHENTIK_BASE_URL || 'http://localhost:9000';
const AUTHENTIK_APPLICATION = process.env.AUTHENTIK_APPLICATION || 'lunacycle';
const JWKS_URI = `${AUTHENTIK_BASE_URL}/application/o/${AUTHENTIK_APPLICATION}/jwks/`;
const ISSUER = `${AUTHENTIK_BASE_URL}/application/o/${AUTHENTIK_APPLICATION}/`;

// Create JWKS client for token verification
const jwks = createRemoteJWKSet(new URL(JWKS_URI));

export interface AuthentikUser {
  sub: string;                    // User ID
  email: string;                  // Email address
  email_verified: boolean;        // Email verification status
  preferred_username: string;     // Username
  name?: string;                  // Full name
  given_name?: string;           // First name
  family_name?: string;          // Last name
  groups: string[];              // User groups for RBAC
  aud: string;                   // Audience
  iss: string;                   // Issuer
  iat: number;                   // Issued at
  exp: number;                   // Expiration
}

/**
 * Verify and decode an Authentik JWT access token
 * @param token - The JWT access token from the Authorization header
 * @returns The decoded token payload with user information
 * @throws Error if token is invalid or expired
 */
export async function verifyToken(token: string): Promise<AuthentikUser> {
  try {
    // Verify the token using JWKS and validate issuer
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      // Optionally validate audience if configured
      // audience: 'lunacycle-web',
    });

    // Extract user information from token
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
    // Log error for debugging
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check if a user has a specific role/group
 * @param user - The authenticated user
 * @param group - The group name to check
 * @returns True if user is in the group
 */
export function hasGroup(user: AuthentikUser, group: string): boolean {
  return user.groups.includes(group);
}

/**
 * Check if user is an admin (member of lunacycle-admins group)
 * @param user - The authenticated user
 * @returns True if user is an admin
 */
export function isAdmin(user: AuthentikUser): boolean {
  return hasGroup(user, 'lunacycle-admins');
}

/**
 * Map Authentik groups to local user role
 * @param groups - Array of Authentik group names
 * @returns Role string (admin or user)
 */
export function mapGroupsToRole(groups: string[]): 'admin' | 'user' {
  if (groups.includes('lunacycle-admins')) {
    return 'admin';
  }
  return 'user';
}

/**
 * Map Authentik user to local user role
 * @param user - The authenticated user
 * @returns Role string (admin or user)
 */
export function getUserRole(user: AuthentikUser): 'admin' | 'user' {
  return mapGroupsToRole(user.groups);
}

/**
 * Sync Authentik user to local database
 * Finds the user by email and updates their name and role from Authentik
 * This bridges Authentik identity with local app data (task assignments, etc.)
 *
 * @param authentikUser - The authenticated user from Authentik token
 * @returns The local user ID for database queries
 * @throws Error if user not found in local database
 */
export async function syncUserToDatabase(authentikUser: AuthentikUser): Promise<string> {
  // Find local user by email (email is the bridge between systems)
  const localUser = await db.query.user.findFirst({
    where: eq(user.email, authentikUser.email)
  });

  if (!localUser) {
    // User exists in Authentik but not in local DB
    // This shouldn't happen for existing users, but could happen if
    // a new user is added to Authentik
    throw new Error(`User ${authentikUser.email} not found in local database. Please create user record first.`);
  }

  // Determine role from Authentik groups
  const role = mapGroupsToRole(authentikUser.groups);

  // Use preferred_username or name from token, fallback to existing name
  const displayName = authentikUser.preferred_username || authentikUser.name || localUser.name;

  // Update user record with latest info from Authentik
  await db.update(user)
    .set({
      name: displayName,
      role: role,
    })
    .where(eq(user.email, authentikUser.email));

  console.log(`✓ Synced user: ${authentikUser.email} (role: ${role}, local ID: ${localUser.id})`);

  // Return the local database user ID
  // This is used for querying task assignments, user profiles, etc.
  return localUser.id;
}
