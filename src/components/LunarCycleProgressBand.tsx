
import React, { useState, useEffect } from 'react';

type LunarCycleProgressBandProps = {
  currentDate?: Date;
  className?: string;
};

export default function LunarCycleProgressBand({ 
  currentDate,
  className 
}: LunarCycleProgressBandProps) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [cyclePosition, setCyclePosition] = useState(0);
  
  // Calculate days left in lunar cycle and position
  useEffect(() => {
    const date = currentDate || new Date();
    
    // Simplified lunar phase calculation similar to LunarPhase component
    // A lunar cycle is approximately 29.53 days
    const calculateLunarCycleInfo = (date: Date) => {
      // Known new moon date for reference
      const knownNewMoon = new Date('2023-06-18');
      const daysSinceKnownNewMoon = Math.floor(
        (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Normalize to get position in current cycle (0 to 29.53)
      const dayInCycle = (daysSinceKnownNewMoon % 29.53);
      
      // Convert to a position in the cycle from 0 to 1
      const position = dayInCycle / 29.53;
      
      // Calculate days left until next new moon
      const daysLeftInCycle = Math.ceil(29.53 - dayInCycle);
      
      return { position, daysLeftInCycle };
    };
    
    const { position, daysLeftInCycle } = calculateLunarCycleInfo(date);
    setCyclePosition(position);
    setDaysLeft(daysLeftInCycle);
  }, [currentDate]);
  
  // Calculate the background gradient position
  const getGradientPosition = () => {
    // The progress should be centered around the full moon (0.5 in cycle)
    // and return to darker at new moon (0 or 1 in cycle)
    return `${cyclePosition * 100}%`;
  };
  
  return (
    <div className={`relative w-full h-6 rounded-lg overflow-hidden ${className || ''}`}>
      {/* Gradient band */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-100 to-gray-900"
        style={{ 
          backgroundPosition: getGradientPosition(),
          backgroundSize: '200% 100%'
        }}
      />
      
    </div>
  );
}
