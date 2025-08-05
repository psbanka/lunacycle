import { useEffect, useState } from 'react';
import { getLunarPhase, calculateDaysUntilNextFullMoon, type MoonPhase } from "../../shared/lunarPhase";

export default function useLunarPhase(endDate?: string) {
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
    if (endDate) {
      const endDateObj = new Date(endDate);
      const timeUntilEnd = endDateObj.getTime() - today.getTime();
      const daysUntilEnd = Math.ceil(timeUntilEnd / (1000 * 3600 * 24));
      setDaysRemaining(daysUntilEnd);
    } else {
      setDaysRemaining(calculateDaysUntilNextFullMoon());
    }
    setInModificationWindow(inWindow)
  }, [currentDate, endDate, today]);
  
  return { phase, phaseName, daysRemaining, inModificationWindow };
}
