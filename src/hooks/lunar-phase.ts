import { useEffect, useState } from 'react';

type MoonPhase = 
  | 'new-moon' 
  | 'waxing-crescent' 
  | 'first-quarter' 
  | 'waxing-gibbous' 
  | 'full-moon' 
  | 'waning-gibbous' 
  | 'last-quarter' 
  | 'waning-crescent';

const DAYS_IN_LUNAR_CYCLE = 29.53;

const getLunarPhase = (date?: Date): { phase: MoonPhase; name: string } => {
  date = date ?? new Date();
  
  // Known new moon date for reference
  const knownNewMoon = new Date('2023-06-18');
  const daysSinceKnownNewMoon = Math.floor(
    (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Normalize to get position in current cycle (0 to 29.53)
  const dayInCycle = (daysSinceKnownNewMoon % DAYS_IN_LUNAR_CYCLE);
  
  // Convert to a position in the cycle from 0 to 1
  const cyclePosition = dayInCycle / DAYS_IN_LUNAR_CYCLE;
  
  // Determine phase
  if (cyclePosition < 0.025) return { phase: 'new-moon', name: 'New Moon' };
  if (cyclePosition < 0.25) return { phase: 'waxing-crescent', name: 'Waxing Crescent' };
  if (cyclePosition < 0.275) return { phase: 'first-quarter', name: 'First Quarter' };
  if (cyclePosition < 0.475) return { phase: 'waxing-gibbous', name: 'Waxing Gibbous' };
  if (cyclePosition < 0.525) return { phase: 'full-moon', name: 'Full Moon' };
  if (cyclePosition < 0.725) return { phase: 'waning-gibbous', name: 'Waning Gibbous' };
  if (cyclePosition < 0.775) return { phase: 'last-quarter', name: 'Last Quarter' };
  if (cyclePosition < 0.975) return { phase: 'waning-crescent', name: 'Waning Crescent' };
  return { phase: 'new-moon', name: 'New Moon' };
};

const calculateDaysUntilNextFullMoon = (): number => {
  const { phase: currentPhase } = getLunarPhase();

  if (currentPhase === "full-moon") {
    return 0;
  }

  let daysUntilFullMoon = 0;
  const tempDate = new Date();
  while (daysUntilFullMoon < DAYS_IN_LUNAR_CYCLE) {
    tempDate.setDate(tempDate.getDate() + 1);
    const { phase } = getLunarPhase(tempDate);
    daysUntilFullMoon++;
    if (phase === "full-moon") {
      return daysUntilFullMoon;
    }
  }
  return DAYS_IN_LUNAR_CYCLE;
};

export default function useLunarPhase() {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [phase, setPhase] = useState<MoonPhase>('full-moon');
  const [phaseName, setPhaseName] = useState('Full Moon');

  const today = new Date();
  const currentDate = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Get lunar phase based on date
  useEffect(() => {
    const { phase: currentPhase, name } = getLunarPhase();
    setPhase(currentPhase);
    setPhaseName(name);
    setDaysRemaining(calculateDaysUntilNextFullMoon());
  }, [currentDate]);
  
  return { phase, phaseName, daysRemaining };
}
