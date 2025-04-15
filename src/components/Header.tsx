import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTheme,
  ALCHEMICAL_THEMES,
  type AlchemicalTheme,
} from "@/contexts/ThemeContext";
import { LogOut, Moon, Sun, User, Paintbrush, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function Header() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme, alchemicalTheme, setAlchemicalTheme } =
    useTheme();

  return (
    <header className="py-4 px-4 sm:px-6 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center">
          <Logo />
          <h1 className="ml-2 text-3xl text-foreground">luneria</h1>
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

        <div className="">
          {ALCHEMICAL_THEMES.map((theme) => (
            <Button
              key={theme}
              variant={alchemicalTheme === theme ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => setAlchemicalTheme(theme)}>
              <Paintbrush className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline">{user.name}</span>

            {user.role === "admin" && (
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
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
