
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LogOut, Moon, Sun, User } from "lucide-react";
import LunarPhase from "./LunarPhase";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function Header() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <header className="py-4 px-4 sm:px-6 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center">
          <Logo />
          <h1 className="ml-2 text-xl font-bold text-foreground">Luneria</h1>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline">{user.name}</span>
            
            {user.role === 'admin' && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <User className="h-3.5 w-3.5" />
                  Admin
                </Button>
              </Link>
            )}
            
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
