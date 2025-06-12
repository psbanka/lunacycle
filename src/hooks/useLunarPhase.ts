import { useEffect, useState } from 'react';
import { getLunarPhase, calculateDaysUntilNextFullMoon, type MoonPhase } from "../../shared/lunarPhase";

export default function useLunarPhase() {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [phase, setPhase] = useState<MoonPhase>('full-moon');
  const [phaseName, setPhaseName] = useState('Full Moon');
  const [inModificationWindow, setInModificationWindow] = useState(false);

  const today = new Date();
  const currentDate = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Get lunar phase based on date
  useEffect(() => {
    const { phase: currentPhase, name, inWindow } = getLunarPhase();
    setPhase(currentPhase);
    setPhaseName(name);
    setDaysRemaining(calculateDaysUntilNextFullMoon());
    setInModificationWindow(inWindow)
  }, [currentDate]);
  
  return { phase, phaseName, daysRemaining, inModificationWindow };
}
