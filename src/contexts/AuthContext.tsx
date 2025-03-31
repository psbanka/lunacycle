
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  role: 'user' | 'admin';
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Mock user data for demo
const MOCK_USERS = [
  { id: '1', email: 'admin@example.com', password: 'admin123', name: 'Admin User', role: 'admin' as const },
  { id: '2', email: 'user@example.com', password: 'user123', name: 'Regular User', role: 'user' as const },
  { id: '3', email: 'user2@example.com', password: 'user123', name: 'Family Member', role: 'user' as const },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('lunarTaskUser');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('lunarTaskUser');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      const foundUser = MOCK_USERS.find(
        u => u.email === email && u.password === password
      );
      
      if (!foundUser) {
        throw new Error('Invalid credentials');
      }
      
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      
      // Store in localStorage with 90-day expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      
      localStorage.setItem('lunarTaskUser', JSON.stringify(userWithoutPassword));
      localStorage.setItem('lunarTaskUserExpiry', expiryDate.toISOString());
      
      toast.success(`Welcome back, ${userWithoutPassword.name}!`);
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lunarTaskUser');
    localStorage.removeItem('lunarTaskUserExpiry');
    toast.info('You have been logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
