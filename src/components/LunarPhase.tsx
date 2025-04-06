
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type MoonPhase = 
  | 'new-moon' 
  | 'waxing-crescent' 
  | 'first-quarter' 
  | 'waxing-gibbous' 
  | 'full-moon' 
  | 'waning-gibbous' 
  | 'last-quarter' 
  | 'waning-crescent';

type LunarPhaseProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  currentDate?: Date;
  showLabel?: boolean;
};

export default function LunarPhase({ 
  size = 'md', 
  className,
  currentDate,
  showLabel = true
}: LunarPhaseProps) {
  const [phase, setPhase] = useState<MoonPhase>('full-moon');
  const [phaseName, setPhaseName] = useState('Full Moon');
  
  // Get lunar phase based on date
  useEffect(() => {
    const date = currentDate || new Date();
    
    // Simplified lunar phase calculation
    // A lunar cycle is approximately 29.53 days
    const getLunarPhase = (date: Date): { phase: MoonPhase; name: string } => {
      // Known new moon date for reference
      const knownNewMoon = new Date('2023-06-18');
      const daysSinceKnownNewMoon = Math.floor(
        (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Normalize to get position in current cycle (0 to 29.53)
      const dayInCycle = (daysSinceKnownNewMoon % 29.53);
      
      // Convert to a position in the cycle from 0 to 1
      const cyclePosition = dayInCycle / 29.53;
      
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
    
    const { phase: currentPhase, name } = getLunarPhase(date);
    setPhase(currentPhase);
    setPhaseName(name);
  }, [currentDate]);
  
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };
  
  // Render the appropriate moon phase
  const renderMoon = () => {
    const baseClasses = cn(
      'rounded-full animate-float',
      sizeClasses[size],
      className
    );
    
    switch (phase) {
      case 'new-moon':
        return (
          <div className={cn(baseClasses, 'bg-lunar-navy dark:bg-gray-900 border border-white/10')} 
            title={phaseName} />
        );
        
      case 'full-moon':
        return (
          <div className={cn(baseClasses, 'bg-lunar-silver dark:bg-gray-200 moon-glow')} 
            title={phaseName} />
        );
        
      case 'waxing-crescent':
        return (
          <div className={cn(baseClasses, 'bg-lunar-navy dark:bg-gray-900 overflow-hidden relative')} title={phaseName}>
            <div className="absolute h-full right-0 bg-lunar-silver dark:bg-gray-200 rounded-r-full" style={{ width: '30%' }}></div>
          </div>
        );
        
      case 'first-quarter':
        return (
          <div className={cn(baseClasses, 'bg-lunar-navy dark:bg-gray-900 overflow-hidden relative')} title={phaseName}>
            <div className="absolute h-full right-0 bg-lunar-silver dark:bg-gray-200 rounded-r-full" style={{ width: '50%' }}></div>
          </div>
        );
        
      case 'waxing-gibbous':
        return (
          <div className={cn(baseClasses, 'bg-lunar-navy dark:bg-gray-900 overflow-hidden relative')} title={phaseName}>
            <div className="absolute h-full right-0 bg-lunar-silver dark:bg-gray-200 rounded-r-full" style={{ width: '75%' }}></div>
          </div>
        );
        
      case 'waning-gibbous':
        return (
          <div className={cn(baseClasses, 'bg-lunar-navy dark:bg-gray-900 overflow-hidden relative')} title={phaseName}>
            <div className="absolute h-full left-0 bg-lunar-silver dark:bg-gray-200 rounded-l-full" style={{ width: '75%' }}></div>
          </div>
        );
        
      case 'last-quarter':
        return (
          <div className={cn(baseClasses, 'bg-lunar-navy dark:bg-gray-900 overflow-hidden relative')} title={phaseName}>
            <div className="absolute h-full left-0 bg-lunar-silver dark:bg-gray-200 rounded-l-full" style={{ width: '50%' }}></div>
          </div>
        );
        
      case 'waning-crescent':
        return (
          <div className={cn(baseClasses, 'bg-lunar-navy dark:bg-gray-900 overflow-hidden relative')} title={phaseName}>
            <div className="absolute h-full left-0 bg-lunar-silver dark:bg-gray-200 rounded-l-full" style={{ width: '30%' }}></div>
          </div>
        );
        
      default:
        return (
          <div className={cn(baseClasses, 'bg-lunar-silver dark:bg-gray-200')} title={phaseName} />
        );
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      {renderMoon()}
      {showLabel && <p className="text-xs mt-1 text-muted-foreground">{phaseName}</p>}
    </div>
  );
}
