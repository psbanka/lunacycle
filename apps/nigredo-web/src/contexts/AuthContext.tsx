/* eslint-disable react-refresh/only-export-components */
import {
  type FC,
  type ReactNode,
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { AuthentikOAuthClient, decodeJWT } from "@lunacycle/auth-client";

type User = {
  email: string;
  id: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initiateLogin: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
};

const LOCALSTORAGE_KEYS = {
  accessToken: "authentik_access_token",
  refreshToken: "authentik_refresh_token",
  idToken: "authentik_id_token",
  state: "oauth_state",
  codeVerifier: "oauth_code_verifier",
};

// Using Public Client with PKCE - no client_secret needed (more secure for SPAs)
const oauthClient = new AuthentikOAuthClient({
  authority: 'http://localhost:9000/application/o',
  client_id: 'nigredo-web',
  redirect_uri: 'http://localhost:8081/auth/callback',
  scope: 'openid profile email',
  application_slug: 'nigredo',
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem(LOCALSTORAGE_KEYS.accessToken);
    if (!storedAccessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const decoded = decodeJWT(storedAccessToken);
      if (!decoded) {
        throw new Error('Invalid token');
      }

      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        const refreshToken = localStorage.getItem(LOCALSTORAGE_KEYS.refreshToken);
        if (refreshToken) {
          refreshAccessToken(refreshToken);
        } else {
          clearTokens();
        }
        setIsLoading(false);
        return;
      }

      const groups = decoded.groups || [];
      const role = groups.includes('nigredo-admins') ? 'admin' : 'user';

      setUser({
        id: decoded.sub,
        email: decoded.email,
        name: decoded.preferred_username || decoded.name || decoded.email,
        role: role,
      });
    } catch (error) {
      console.error('Failed to restore session:', error);
      clearTokens();
    }

    setIsLoading(false);
  }, []);

  const clearTokens = () => {
    localStorage.removeItem(LOCALSTORAGE_KEYS.accessToken);
    localStorage.removeItem(LOCALSTORAGE_KEYS.refreshToken);
    localStorage.removeItem(LOCALSTORAGE_KEYS.idToken);
    setUser(null);
  };

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const tokens = await oauthClient.refreshAccessToken(refreshToken);
      localStorage.setItem(LOCALSTORAGE_KEYS.accessToken, tokens.access_token);
      localStorage.setItem(LOCALSTORAGE_KEYS.refreshToken, tokens.refresh_token);
      localStorage.setItem(LOCALSTORAGE_KEYS.idToken, tokens.id_token);

      const decoded = decodeJWT(tokens.access_token);
      const groups = decoded.groups || [];
      const role = groups.includes('nigredo-admins') ? 'admin' : 'user';

      setUser({
        id: decoded.sub,
        email: decoded.email,
        name: decoded.preferred_username || decoded.name || decoded.email,
        role: role,
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokens();
    }
  };

  const initiateLogin = async () => {
    try {
      const { url, state, codeVerifier } = await oauthClient.initiateLogin();
      sessionStorage.setItem(LOCALSTORAGE_KEYS.state, state);
      sessionStorage.setItem(LOCALSTORAGE_KEYS.codeVerifier, codeVerifier);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to initiate login:', error);
      alert('Failed to initiate login');
    }
  };

  const handleCallback = async (code: string, state: string) => {
    setIsLoading(true);

    try {
      const savedState = sessionStorage.getItem(LOCALSTORAGE_KEYS.state);
      if (state !== savedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      const codeVerifier = sessionStorage.getItem(LOCALSTORAGE_KEYS.codeVerifier);
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      const tokens = await oauthClient.exchangeCodeForTokens(code, codeVerifier);

      localStorage.setItem(LOCALSTORAGE_KEYS.accessToken, tokens.access_token);
      localStorage.setItem(LOCALSTORAGE_KEYS.refreshToken, tokens.refresh_token);
      localStorage.setItem(LOCALSTORAGE_KEYS.idToken, tokens.id_token);

      sessionStorage.removeItem(LOCALSTORAGE_KEYS.state);
      sessionStorage.removeItem(LOCALSTORAGE_KEYS.codeVerifier);

      const decoded = decodeJWT(tokens.access_token);
      const groups = decoded.groups || [];
      const role = groups.includes('nigredo-admins') ? 'admin' : 'user';

      const newUser = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.preferred_username || decoded.name || decoded.email,
        role: role,
      };

      setUser(newUser);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      alert('Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const idToken = localStorage.getItem(LOCALSTORAGE_KEYS.idToken);
    clearTokens();

    const postLogoutUri = `${window.location.origin}/login`;
    const logoutUrl = oauthClient.getLogoutUrl(idToken || undefined, postLogoutUri);
    window.location.href = logoutUrl;
  };

  const getAccessToken = (): string | null => {
    return localStorage.getItem(LOCALSTORAGE_KEYS.accessToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        initiateLogin,
        handleCallback,
        logout,
        getAccessToken,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
