import useLunarPhase from "@/hooks/useLunarPhase";
import { cn } from '@/lib/utils';

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
  const { phase, phaseName } = useLunarPhase();
  
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
