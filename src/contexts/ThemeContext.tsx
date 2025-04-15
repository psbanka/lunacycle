import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";

type Theme = "system" | "light" | "dark";

export const ALCHEMICAL_THEMES = [
  "default",
  "nigredo",
  "albedo",
  "citrinitas",
  "rubedo",
] as const;
export type AlchemicalTheme = typeof ALCHEMICAL_THEMES[number];

interface ThemeContextProps {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  alchemicalTheme: AlchemicalTheme;
  setAlchemicalTheme: (theme: AlchemicalTheme) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "system",
  isDarkMode: false,
  toggleTheme: () => {},
  alchemicalTheme: "default",
  setAlchemicalTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("system");
  const [alchemicalTheme, setAlchemicalTheme] =
    useState<AlchemicalTheme>("default");

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "system") return "light";
      if (prevTheme === "light") return "dark";
      return "system";
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");
    root.classList.remove(
      "theme-default",
      "theme-nigredo",
      "theme-albedo",
      "theme-citrinitas",
      "theme-rubedo"
    );

    // Add new theme classes
    root.classList.add(isDarkMode ? "dark" : "light");
    root.classList.add(`theme-${alchemicalTheme}`);
  }, [isDarkMode, alchemicalTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        alchemicalTheme,
        setAlchemicalTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
