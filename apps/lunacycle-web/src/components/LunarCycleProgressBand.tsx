import React, { useState, useEffect } from 'react';
import { useLoadable } from "atom.io/react";
import useLunarPhase from "@/hooks/useLunarPhase";
import { currentMonthAtom, getPlaceholderMonth } from "@/atoms";

type LunarCycleProgressBandProps = {
  currentDate?: Date;
  className?: string;
};

export default function LunarCycleProgressBand({
  currentDate,
  className,
}: LunarCycleProgressBandProps) {
  const [cyclePosition, setCyclePosition] = useState(0);
  const { daysRemaining } = useLunarPhase();

  // Calculate lunar cycle position
  useEffect(() => {
    const date = currentDate || new Date();

    // Simplified lunar phase calculation
    // A lunar cycle is approximately 29.53 days
    const calculateLunarCyclePosition = (date: Date) => {
      // Known new moon date for reference
      const knownNewMoon = new Date('2023-06-18');
      const daysSinceKnownNewMoon = Math.floor(
        (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Normalize to get position in current cycle (0 to 29.53)
      const dayInCycle = daysSinceKnownNewMoon % 29.53;

      // Convert to a position in the cycle from 0 to 1
      const position = dayInCycle / 29.53;

      return position;
    };

    const position = calculateLunarCyclePosition(date);
    setCyclePosition(position);
  }, [currentDate]);

  // Calculate the background gradient
  const getGradient = () => {
    // Full moon (0.5) should be white, new moon (0 or 1) should be black
    // We want to map the cycle position to a gradient that goes from
    // the current moon phase to black, then back to white, then back to the current phase
    const fullMoonPosition = 0.5;
    const newMoonPositions = [0, 1];

    // Calculate the distance from the current position to the nearest new moon
    const distanceToNewMoon = Math.min(
      Math.abs(cyclePosition - newMoonPositions[0]),
      Math.abs(cyclePosition - newMoonPositions[1])
    );

    // Calculate the distance from the current position to the full moon
    const distanceToFullMoon = Math.abs(cyclePosition - fullMoonPosition);

    // Determine the color intensity based on the distances
    let startColorIntensity = 1 - (distanceToNewMoon * 2); // 1 at new moon, 0 at half moon
    let endColorIntensity = 1 - (distanceToFullMoon * 2); // 1 at full moon, 0 at half moon

    // Clamp the values between 0 and 1
    startColorIntensity = Math.max(0, Math.min(1, startColorIntensity));
    endColorIntensity = Math.max(0, Math.min(1, endColorIntensity));

    // Convert the intensity to a color
    const startColor = `rgb(${startColorIntensity * 255}, ${startColorIntensity * 255}, ${startColorIntensity * 255})`;
    const endColor = `rgb(${endColorIntensity * 255}, ${endColorIntensity * 255}, ${endColorIntensity * 255})`;

    // Create the gradient string
    // REVERSED THE GRADIENT
    return `linear-gradient(to right, ${endColor}, black, ${startColor})`;
  };

  return (
    <div className={`relative w-full h-6 rounded-lg overflow-hidden ${className || ''}`}>
      {/* Gradient band */}
      <div
        className="absolute inset-0"
        style={{
          background: getGradient(),
        }}
      >
        <p className="text-muted-foreground">
          {daysRemaining} days left
        </p>
      </div>
    </div>
  );
}
