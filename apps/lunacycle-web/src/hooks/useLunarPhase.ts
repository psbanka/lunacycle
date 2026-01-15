import { useEffect, useState } from "react";
import {
  getLunarPhase,
  calculateDaysUntilNextFullMoon,
  type MoonPhase,
} from "@lunacycle/lunar-phase";
import { Moon } from "lunarphase-js";
import { useLoadable } from "atom.io/react";
import { currentMonthAtom, getPlaceholderMonth } from "@/atoms";

export default function useLunarPhase() {
  const [phase, setPhase] = useState<MoonPhase>("full-moon");
  const [phaseName, setPhaseName] = useState("Full Moon");
  const currentMonth = useLoadable(currentMonthAtom, getPlaceholderMonth());
  const [inModificationWindow, setInModificationWindow] = useState(false);
  const { startDate, endDate } = currentMonth.value;

  const now = new Date();
  // To ensure we are comparing just dates, we zero out the time part of today's date.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(endDate);

  // Calculate the difference in time (milliseconds), then convert to days.
  const timeRemaining = end.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  return {
    phase,
    phaseName,
    daysRemaining,
    startDate,
    endDate,
    inModificationWindow,
    currentDate: now.toISOString().slice(0, 10),
  };
}
