import React, { useState, useEffect } from "react";
import { useLoadable } from "atom.io/react";
import { getState } from "atom.io";
import {
  currentTaskIdsAtom,
  currentTasksAtom,
  currentMonthAtom,
  statisticsAtom,
  EMPTY_MONTH,
  EMPTY_STATISTICS,
} from "@/atoms";

export function LoadIndicator() {
  const currentMonth = useLoadable(currentMonthAtom, EMPTY_MONTH);
  const currentTaskIds = useLoadable(currentTaskIdsAtom, []);
  const statistics = useLoadable(statisticsAtom, EMPTY_STATISTICS);
  const [storyPoints, setStoryPoints] = useState(0);
  const [averageCompletedStoryPoints, setAverageCompletedStoryPoints] =
    useState(0);

  // Calculate average completed story points
  useEffect(() => {
    if (!statistics) return;
    let totalCompletedStoryPoints = 0;
    const totalMonths = statistics.value.overall.length - 1;
    statistics.value.overall.forEach(({ monthId, completed }) => {
      if (monthId !== currentMonth?.value.id) {
        totalCompletedStoryPoints += completed;
      }
    });
    setAverageCompletedStoryPoints(totalCompletedStoryPoints / totalMonths);
  }, [statistics, currentMonth]);

  const GAUGE_VISIBLE_MAX = averageCompletedStoryPoints * 1.2; // Gauge visually extends to 120%
  const INDICATOR_WIDTH_PX = 12; // w-3 in Tailwind (0.75rem = 12px if 1rem=16px)

  // Calculate month load
  useEffect(() => {
    async function calculateStoryPoints() {
      if (currentTaskIds.loading) return;
      let totalStoryPoints = 0
      for (const taskId of currentTaskIds.value) {
        const task = await getState(currentTasksAtom, taskId);
        if (task instanceof Error) continue;
        totalStoryPoints += task.storyPoints;
      }
      setStoryPoints(totalStoryPoints);
    }
    calculateStoryPoints();
  }, [currentTaskIds]);

  // Calculate fullness for color (relative to MAX_STORY_POINTS)
  const fullnessPercent = (storyPoints / averageCompletedStoryPoints) * 100;

  const getGaugeBackgroundColor = () => {
    if (fullnessPercent < 0) return "bg-gray-300"; // Should ideally not happen
    if (fullnessPercent <= 33) return "bg-blue-500";
    if (fullnessPercent <= 66) return "bg-yellow-400";
    if (fullnessPercent <= 100) return "bg-orange-500";
    return "bg-red-600"; // Over 100% of averageCompletedStoryPoints
  };

  // Calculate indicator position (relative to GAUGE_VISIBLE_MAX)
  // The indicator visually stops at 100% of the gauge's drawn width.
  const indicatorPositionPercent = Math.min(
    100,
    Math.max(0, (storyPoints / GAUGE_VISIBLE_MAX) * 100)
  );

  return (
    <div className="w-full mb-4">
      <div
        className={`relative w-full h-6 rounded-lg overflow-hidden ${getGaugeBackgroundColor()}`}>
        {/* Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-800 dark:bg-white rounded-full shadow-lg border-2 border-white dark:border-neutral-900"
          style={{
            left: `calc(${indicatorPositionPercent}% - ${
              INDICATOR_WIDTH_PX / 2
            }px)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/*
          <p className="text-xs font-semibold text-white mix-blend-difference">
            {storyPoints} / {averageCompletedStoryPoints}
          </p>
          */}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
        <span>0</span>
        <span>{GAUGE_VISIBLE_MAX}</span>
      </div>
    </div>
  );
}
