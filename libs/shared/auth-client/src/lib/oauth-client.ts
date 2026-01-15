/**
 * OAuth2 PKCE Client for Authentik
 * Implements Authorization Code flow with PKCE for secure SPA authentication
 */

export interface OAuthConfig {
  authority: string;          // http://localhost:9000/application/o
  client_id: string;          // lunacycle-web
  client_secret?: string;     // Optional for PKCE flow
  redirect_uri: string;       // http://localhost:8080/auth/callback
  scope: string;              // openid profile email
  application_slug?: string;  // lunacycle (for app-specific endpoints)
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Generate a random code verifier for PKCE
 * @returns Base64-URL encoded random string
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 * @param verifier - The code verifier
 * @returns Base64-URL encoded SHA-256 hash
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64-URL encode (without padding)
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a random state parameter for CSRF protection
 */
function generateState(): string {
  return crypto.randomUUID();
}

export class AuthentikOAuthClient {
  constructor(private config: OAuthConfig) {}

  /**
   * Initiate the OAuth authorization flow
   * Generates PKCE parameters and redirects to Authentik
   * @returns Object with authorization URL and PKCE parameters to store
   */
  async initiateLogin(): Promise<{ url: string; state: string; codeVerifier: string }> {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      client_id: this.config.client_id,
      redirect_uri: this.config.redirect_uri,
      response_type: 'code',
      scope: this.config.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const url = `${this.config.authority}/authorize/?${params}`;

    return { url, state, codeVerifier };
  }

  /**
   * Exchange authorization code for tokens
   * @param code - Authorization code from callback
   * @param codeVerifier - PKCE code verifier from initiateLogin
   * @returns Token response with access_token, id_token, and refresh_token
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.client_id,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirect_uri,
    });

    // Add client_secret if provided (confidential clients)
    if (this.config.client_secret) {
      params.append('client_secret', this.config.client_secret);
    }

    const response = await fetch(`${this.config.authority}/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh the access token using refresh token
   * @param refreshToken - The refresh token from previous token response
   * @returns New token response
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.client_id,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    if (this.config.client_secret) {
      params.append('client_secret', this.config.client_secret);
    }

    const response = await fetch(`${this.config.authority}/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user info from Authentik
   * @param accessToken - The access token
   * @returns User information
   */
  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(`${this.config.authority}/userinfo/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  /**
   * Logout from Authentik
   * @param idToken - The ID token from login
   * @param postLogoutRedirectUri - Where to redirect after logout (defaults to redirect_uri)
   */
  getLogoutUrl(idToken?: string, postLogoutRedirectUri?: string): string {
    const params = new URLSearchParams({
      post_logout_redirect_uri: postLogoutRedirectUri || this.config.redirect_uri,
    });

    if (idToken) {
      params.append('id_token_hint', idToken);
    }

    // Authentik's end-session endpoint requires the application slug
    const slug = this.config.application_slug || '';
    const endSessionPath = slug ? `/${slug}/end-session/` : '/end-session/';
    return `${this.config.authority}${endSessionPath}?${params}`;
  }
}

/**
 * Decode JWT token (without verification - for display only)
 * @param token - JWT token
 * @returns Decoded payload
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}
