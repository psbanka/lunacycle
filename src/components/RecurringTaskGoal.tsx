import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Task } from "../../server/schema";
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
import { type RecurringTaskData, VelocityData } from "server";
import { Button } from "@/components/ui/button";

interface RecurringTaskGoalProps {
  recurringTask: RecurringTaskData;
  committed: boolean;
  toggleCommitted: (number) => void;
  planning: boolean;
}

const ICON_LOOKUP = {
  "trend-upward": TrendingUp,
  "trend-downward": TrendingDown,
  upward: MoveUpRight,
  downward: MoveDownRight,
  neutral: Minus,
};

const determineSuggestedTarget = (history: VelocityData, task: Task) => {
  /**
   * Strategy:
   * 1. If you didn't do it last cycle, do it once.
   * 2. <You did it at least once>: If you're on a downward trend, do it one more than last time
   * 3. If the last time is less than average, do it the average.
   * 4. If the last time is less than target, do target
   * 5. do 1 + target, but not more than 1+ target
   */
  const completedArray = history.map((item) => item.completed);
  const lastHistory = completedArray[completedArray.length - 1];
  if (lastHistory === 0) return 1; // get back on the board

  const secondLastHistory = completedArray[completedArray.length - 2];
  if (lastHistory < secondLastHistory) return lastHistory + 1;

  const average =
    completedArray.reduce((a, b) => a + b, 0) / completedArray.length;
  if (lastHistory < average) return Math.floor(average);

  if (lastHistory < task.targetCount) return task.targetCount;
  return task.targetCount + 1;
};

const RecurringTaskGoal = (props: RecurringTaskGoalProps) => {
  const [committedGoal, setCommittedGoal] = useState<number | undefined>();
  const [disabled, setDisabled] = useState<boolean>(false);
  const { task, history } = props.recurringTask;

  const getTrend = ():
    | "upward"
    | "trend-upward"
    | "neutral"
    | "trend-downward"
    | "downward" => {
    if (history.length < 2) {
      return "neutral";
    }
    const last = history[history.length - 1].completed;
    const secondLast = history[history.length - 2].completed;
    if (history.length < 3) {
      if (last > secondLast) return "trend-upward";
      if (last < secondLast) return "trend-downward";
      return "neutral";
    }
    const thirdLast = history[history.length - 3].completed;
    if (last > secondLast) {
      if (secondLast > thirdLast) return "upward";
      return "trend-upward";
    } else if (last < secondLast) {
      if (secondLast < thirdLast) return "downward";
      return "trend-downward";
    }
    return "neutral";
  };

  const trend = getTrend();

  const trendClasses =
    trend === "upward"
      ? "bg-green-500/10 border-green-500/20 text-accent dark:text-green-300"
      : trend === "downward"
      ? "bg-red-500/10 border-red-500/20 text-danger dark:text-red-300"
      : trend === "trend-downward"
      ? "bg-red-100/10 border-red-100/20 text-primary dark:text-red-300"
      : trend === "trend-upward"
      ? "bg-green-100/10 border-green-100/20 text-primary"
      : "bg-muted/30 border-border text-muted-foreground";

  const committedClasses =
    props.planning && props.committed
      ? "bg-green-500/10 border-green-500/20"
      : "";

  const TrendIcon = ICON_LOOKUP[trend];

  const targetValue = task.targetCount;
  const suggestedTargetValue = determineSuggestedTarget(history, task);

  function updateCommittedGoal(upDown: "up" | "down") {
    if (disabled) return;
    const modifier = upDown === "up" ? 1 : -1;
    const newCommittedGoal =
      (committedGoal ?? suggestedTargetValue) + modifier;
    setCommittedGoal(newCommittedGoal);
  }

  const handleCommit = () => {
    props.toggleCommitted(committedGoal ?? suggestedTargetValue);
    setDisabled((prev) => !prev);
  };


  return (
    <div
      className={cn(
        "p-3 rounded-lg border flex items-center gap-3",
        trendClasses,
        committedClasses
      )}>
      <TrendIcon className="h-5 w-5 shrink-0" />
      <h3 className="font-medium grow text-left">{task.title}</h3>
      <div className="flex flex-row items-center gap-2">
        <h2>{targetValue}</h2>
        <ArrowBigRightDash />
        <h2>{committedGoal ?? suggestedTargetValue}</h2>
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
            variant={props.committed ? "default" : "outline-solid"}
            size="icon"
            className="h-6 w-6"
            onClick={handleCommit}>
            <CircleCheckBig className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecurringTaskGoal;
