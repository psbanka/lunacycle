import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { TemplateTask } from "../../server/schema";
import {
  ArrowBigRightDash,
  MoveUpRight,
  MoveDownRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CirclePlus,
  CircleMinus,
  CircleCheckBig,
} from "lucide-react";
import { type RecurringTaskData, VelocityData } from "server/appRouter";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecurringTaskGoalProps {
  recurringTask: RecurringTaskData;
  committed: boolean;
  toggleCommitted: (number) => void;
  planning: boolean;
}

const ICON_LOOKUP = {
  "maximize": TrendingUp,
  "minimize": TrendingDown,
  // upward: MoveUpRight,
  // downward: MoveDownRight,
  // null: Minus,
};

function getTrend(history: VelocityData): 'neutral' | 'upward' | 'downward' {
  if (history.length < 2) {
    return "neutral";
  }
  const last = history[history.length - 1].completed;
  const secondLast = history[history.length - 2].completed;
  if (last > secondLast) return "upward";
  if (last < secondLast) return "downward";
  return "neutral";
}


function generateStats(history: VelocityData, templateTask: TemplateTask) {
  const completedArray = history.map((item) => item.completed);
  const lastHistory = completedArray[completedArray.length - 1];
  const trend = getTrend(history);

  const average =
    Math.round(completedArray.reduce((a, b) => a + b, 0) / completedArray.length);

  const didItLastCycle = lastHistory > 0;
  const didItMoreThanTarget = lastHistory > templateTask.targetCount;
  const didItEqualToTarget = lastHistory === templateTask.targetCount;
  const didItLessThanTarget = lastHistory < templateTask.targetCount;
  const didItMoreThanAverage = lastHistory > average;
  const didItLessThanAverage = lastHistory < average;

  return {
    average,
    trend,
    lastHistory,
    didItLastCycle,
    didItMoreThanTarget,
    didItEqualToTarget,
    didItLessThanTarget,
    didItMoreThanAverage,
    didItLessThanAverage,
  };
}

const determineSuggestedTarget = (stats, templateTask: TemplateTask) => {
  let target = templateTask.targetCount;
  if (templateTask.goal === "maximize") {
    /**
     * Strategy:
     * 1. If you didn't do it last cycle, do it once.
     * 2. <You did it at least once>: If you're on a downward trend, do it one more than last time
     * 3. If the last time is less than average, do it the average.
     * 4. If the last time is less than target, do target
     * 5. do 1 + target, but not more than 1+ target
     */
    if (!stats.didItLastCycle) return 1; // get back on the board
    if (stats.trend === "downward") return  stats.lastHistory + 1;
    if (stats.didItLessThanAverage) return stats.average;
    if (stats.didItLessThanTarget) return templateTask.targetCount;
    return Math.min(stats.lastHistory + 1, templateTask.targetCount + 1);
  }
  if (templateTask.goal === "minimize") {
    /**
     * Strategy:
     * If you did it more than target, do it lastAverage - 1
     * if you did it equal to target, target - 1
     * if you did it less than target, take the lesser of (the average - 1) and (target -1)
     */
    if (stats.didItMoreThanTarget) return stats.average - 1;
    if (stats.didItEqualToTarget) return templateTask.targetCount - 1;
    const recommendation = Math.min(stats.average - 1, templateTask.targetCount - 1);
    return Math.max(recommendation, 0);
  }
  return target
};

const RecurringTaskGoal = (props: RecurringTaskGoalProps) => {
  const [committedGoal, setCommittedGoal] = useState<number | undefined>();
  const [disabled, setDisabled] = useState<boolean>(false);
  const { templateTask, history } = props.recurringTask;

  const targetValue = templateTask.targetCount;
  const stats = generateStats(history, templateTask);
  const trend = stats.trend;
  const hoverText = `Your average is ${stats.average}, trending ${trend}.`

  const target  = determineSuggestedTarget(stats, templateTask);

  const trendClasses =
    trend === "upward"
      ? "bg-green-500/10 border-green-500/20 text-danger"
      : trend === "downward"
      ? "bg-red-500/10 border-red-500/20 text-danger"
      // : trend === "trend-downward"
      // ? "bg-red-100/10 border-red-100/20 text-primary dark:text-red-300"
      // : trend === "trend-upward"
      // ? "bg-green-100/10 border-green-100/20 text-danger"
      : "bg-muted/30 border-border text-danger";

  const committedClasses =
    props.planning && props.committed
      ? "bg-green-500/10 border-green-500/20"
      : "";

  const TrendIcon = templateTask.goal == null ? Minus : ICON_LOOKUP[templateTask.goal];

  function updateCommittedGoal(upDown: "up" | "down") {
    if (disabled) return;
    const modifier = upDown === "up" ? 1 : -1;
    const newCommittedGoal =
      (committedGoal ?? target) + modifier;
    setCommittedGoal(newCommittedGoal);
  }

  const handleCommit = () => {
    props.toggleCommitted(committedGoal ?? target);
    setDisabled((prev) => !prev);
  };


  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "p-3 rounded-lg border flex items-center gap-3",
              trendClasses,
              committedClasses
            )}>
            <TrendIcon className="h-5 w-5 shrink-0" />
            <h3 className="font-medium grow text-left">
              {templateTask.title}
            </h3>
            <div className="flex flex-row items-center gap-2">
              <h2>{targetValue}</h2>
              <ArrowBigRightDash />
              <h2>{committedGoal ?? target}</h2>
            </div>
            {props.planning && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={disabled}
                  onClick={() => updateCommittedGoal("up")}>
                  <CirclePlus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={disabled}
                  onClick={() => updateCommittedGoal("down")}>
                  <CircleMinus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant={props.committed ? "default" : "outline"}
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCommit}>
                  <CircleCheckBig className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xl">{hoverText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RecurringTaskGoal;
