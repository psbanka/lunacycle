import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import useLunarPhase, { type MoonPhase } from "@/hooks/lunar-phase";

type LightDarkPreference = "system" | "light" | "dark";

export const ALCHEMICAL_THEMES = [
  "default",
  "nigredo",
  "albedo",
  "citrinitas",
  "rubedo",
] as const;
export type AlchemicalTheme = typeof ALCHEMICAL_THEMES[number];

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  alchemicalTheme: AlchemicalTheme;
}

const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  alchemicalTheme: "default",
});

interface ThemeProviderProps {
  children: ReactNode;
}

function currentTheme(phase: MoonPhase): AlchemicalTheme {
  switch (phase) {
    case "full-moon":
      return "rubedo";
    case "waning-gibbous":
      return "rubedo"
    case "last-quarter":
      return "nigredo"
    case "waning-crescent":
      return "nigredo"
    case "waxing-crescent":
      return "albedo"
    case "waxing-gibbous":
      return "citrinitas"
    case "first-quarter":
      return "citrinitas";
    case "new-moon":
      return "rubedo";
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<LightDarkPreference>("system");
  const { phase } = useLunarPhase();
  const alchemicalTheme = currentTheme(phase);

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleDarkMode = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "system") return "light";
      if (prevTheme === "light") return "dark";
      return "system";
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove(
      "theme-default-light",
      "theme-default-dark",
      "theme-nigredo-light",
      "theme-nigredo-dark",
      "theme-albedo-light",
      "theme-albedo-dark",
      "theme-citrinitas-light",
      "theme-citrinitas-dark",
      "theme-rubedo-light",
      "theme-rubedo-dark"
    );

    // Add new theme classes
    const modeIdentifier = isDarkMode ? "dark" : "light";
    root.classList.add(`theme-${alchemicalTheme}-${modeIdentifier}`);
  }, [isDarkMode, alchemicalTheme]);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        alchemicalTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
