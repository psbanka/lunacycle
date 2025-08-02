import { cn } from "@/lib/utils";
import type { StoryPointType } from "../../shared/types";

export function StoryPointsBadge({ storyPoints }: { storyPoints: StoryPointType }) {

  // Fibonacci numbers for story points badge color
  const getStoryPointsColor = (points: StoryPointType) => {
    switch (points) {
      case 0:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      case 1:
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case 2:
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100";
      case 3:
        return "bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100";
      case 5:
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case 8:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100";
      case 13:
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        getStoryPointsColor(storyPoints)
      )}>
      {storyPoints} SP
    </span>
  )
}

export default StoryPointsBadge