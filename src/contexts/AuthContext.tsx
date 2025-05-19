/* eslint-disable react-refresh/only-export-components */
import {
  type FC,
  type ReactNode,
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { type } from "arktype";
import { trpc } from "../api";
import { toast } from "sonner";
import { AccessToken } from "../../shared/types";
import { jwtDecode } from "jwt-decode";

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const LOCALSTORAGE_TOKENS = {
  accessToken: "lunarTaskAccessToken",
  expiry: "lunarTaskUserExpiry",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAccessTokenFromLocalStorage() {
  const storedAccessToken = localStorage.getItem(LOCALSTORAGE_TOKENS.accessToken);
  if (!storedAccessToken) return null;
  const accessToken = AccessToken(jwtDecode(storedAccessToken));
  if (accessToken instanceof type.errors) {
    console.error("Failed to parse stored user", accessToken.summary);
    localStorage.removeItem(LOCALSTORAGE_TOKENS.accessToken);
    return null;
  }
  // TODO: Check expiration date
  return accessToken;
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<typeof AccessToken.infer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Case 1: Check for existing session on mount
  useEffect(() => {
    const storedAccessToken = getAccessTokenFromLocalStorage();
    if (!storedAccessToken) {
      setIsLoading(false);
      return;
    }
    setAccessToken(storedAccessToken);
    const storedUser = {
      email: accessToken?.email ?? '',
      id: accessToken?.sub ?? '',
      name: accessToken?.preferred_username ?? '',
      role: accessToken?.role ?? '',
    };
    setUser(storedUser);
    const expiryDate = new Date(storedAccessToken.exp * 1000);
    localStorage.setItem(LOCALSTORAGE_TOKENS.expiry, expiryDate.toISOString());
    setIsLoading(false);
  }, [accessToken?.email, accessToken?.preferred_username, accessToken?.role, accessToken?.sub]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const foundUser = await trpc.login.mutate({ email, password });
      if (!foundUser) {
        toast.error("Invalid credentials");
        return;
      }
      const newAccessToken = AccessToken(jwtDecode(foundUser.accessToken));
      if (newAccessToken instanceof type.errors) {
        toast.error(`Failed to parse user: ${newAccessToken.summary}`);
        return;
      }

      const userWithoutPassword = { ...foundUser.user, passwordHash: null };
      setUser(userWithoutPassword);
      setAccessToken(newAccessToken);

      const expiryDate = new Date(newAccessToken.exp * 1000);

      localStorage.setItem(LOCALSTORAGE_TOKENS.accessToken, foundUser.accessToken);
      localStorage.setItem(LOCALSTORAGE_TOKENS.expiry, expiryDate.toISOString());

      toast.success(`Welcome back, ${userWithoutPassword.name}!`);
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(LOCALSTORAGE_TOKENS.accessToken);
    localStorage.removeItem(LOCALSTORAGE_TOKENS.expiry);
    toast.info("You have been logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
