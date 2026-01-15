import { Moon, LunarPhase, LunarMonth } from "lunarphase-js"

export type MoonPhase =
  | "new-moon"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full-moon"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent";

const DAYS_IN_LUNAR_CYCLE = 29.53;

export const getLunarPhase = (
  date?: Date
): { phase: MoonPhase; name: string, inWindow: boolean } => {
  const phase = Moon.lunarPhase()
  switch (phase) {
    case "New":
      return { phase: "new-moon", name: "New Moon", inWindow: false };
    case "Waxing Crescent":
      return { phase: "waxing-crescent", name: "Waxing Crescent", inWindow: false };
    case "First Quarter":
      return { phase: "first-quarter", name: "First Quarter", inWindow: false };
    case "Waxing Gibbous":
      return { phase: "waxing-gibbous", name: "Waxing Gibbous", inWindow: false };
    case "Full":
      return { phase: "full-moon", name: "Full Moon", inWindow: true };
    case "Waning Gibbous":
      return { phase: "waning-gibbous", name: "Waning Gibbous", inWindow: true };
    case "Last Quarter":
      return { phase: "last-quarter", name: "Last Quarter", inWindow: true };
    case "Waning Crescent":
      return { phase: "waning-crescent", name: "Waning Crescent", inWindow: false };
  }
  throw new Error(`Unknown lunar phase: ${phase}`);
};

export const calculateDaysUntilNextFullMoon = (): number => {
  return DAYS_IN_LUNAR_CYCLE - Moon.lunarAge()
};

export const MOON_NAMES = [
  "Wolf Moon",
  "Snow Moon",
  "Worm Moon",
  "Pink Moon",
  "Flower Moon",
  "Strawberry Moon",
  "Buck Moon",
  "Sturgeon Moon",
  "Corn Moon or Harvest Moon*",
  "Hunter’s Moon",
  "Beaver Moon",
  "Cold Moon",
];
