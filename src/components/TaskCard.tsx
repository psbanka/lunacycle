import { useLoadable } from "atom.io/react";
import { cn } from "@/lib/utils";
import { CheckCircle, CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditTaskDialog } from "./EditTaskDialog";
import { StoryPointsBadge } from "./StoryPointsBadge";
import { UserAvatar } from "./UserAvatar";
import { DatePicker } from "./DatePicker";
import {
  currentMonthAtom,
  currentTasksAtom,
  getCurrentTaskPlaceholder,
  getPlaceholderMonth,
  taskCompletions,
  taskSchedules,
} from "@/atoms";
import { completeTask, completeTasks, type CompleteTasksProps } from "@/actions";

type TaskCardProps = {
  taskId: string;
  compact?: boolean;
  className?: string;
};

export default function TaskCard({
  taskId,
  compact = false,
  className,
}: TaskCardProps) {
  const task = useLoadable(
    currentTasksAtom,
    taskId,
    getCurrentTaskPlaceholder(taskId)
  );
  const currentMonth = useLoadable(currentMonthAtom, getPlaceholderMonth());
  const completions = useLoadable(taskCompletions, taskId, 0);
  const schedules = useLoadable(taskSchedules, taskId, 0);
  const targetCount = task.value?.targetCount || 0;
  const isCompleted = completions.value >= targetCount;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const completedPercent =
    task.value.targetCount > 0
      ? (completions.value / task.value.targetCount) * 100
      : 0;

  const scheduledPercent =
    task.value.targetCount > 0
      ? (schedules.value / task.value.targetCount) * 100
      : 0;
  const isScheduled = Math.round(scheduledPercent + completedPercent) === 100;

  const isContinuingTask = task.value.targetCount > 1;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from propagating to the parent div
    completeTask(taskId);
  };

  const handleCompletionSave = (dates: Date[]) => {
    const info: CompleteTasksProps["info"] = dates.map((date) => ({
      userId: null,
      completedAt: date.toISOString(),
    }));
    completeTasks({ taskId, info });
  }

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const isFocused = task.value.isFocused;

  return (
    <>
      <div
        className={cn(
          "@container group relative p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer",
          isCompleted
            ? "bg-secondary/50 border border-secondary"
            : "glass-card hover:shadow-md",
          isContinuingTask &&
            !isCompleted &&
            "border-6 border-secondary/50 bg-primary/5",
          compact ? "w-full max-w-[200px]" : "w-full",
          isFocused && "ring-2 ring-primary/70",
          className
        )}
        onClick={handleEditClick}>
        {/* Task Details */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-2">
            <h3
              className={cn(
                "font-medium transition-colors text-left",
                isCompleted
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
                // Make the title bolder for continuing tasks
                isContinuingTask && !isCompleted && "font-bold"
              )}>
              {task.value.title}
            </h3>

            <StoryPointsBadge storyPoints={task.value.storyPoints} />
          </div>

          {/* Counter for tasks that need to be done multiple times */}
          {task.value.targetCount > 1 && (
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckSquare className="h-4 w-4 mr-1" />
                <span>
                  {task.value.taskCompletions.length} / {task.value.targetCount}
                </span>
              </div>

              {/* Progress bar */}
              <div className="ml-2 flex-1 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full w-full transition-all duration-500"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${completedPercent}%, hsl(var(--primary) / 0.3) ${completedPercent}%, hsl(var(--primary) / 0.3) ${completedPercent + scheduledPercent}%, hsl(var(--secondary)) ${completedPercent + scheduledPercent}%)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {!compact && (
            <div className="mt-4 flex justify-between items-center">
              <div className="flex -space-x-2 avatar-container">
                {task.value.taskUsers.map((tu) => (
                  <UserAvatar
                    key={tu.userId}
                    userId={tu.userId}
                    dimmed={true}
                  />
                ))}
              </div>

              <Button
                onClick={handleComplete}
                variant="secondary"
                size="sm"
                disabled={isCompleted}
                className="text-xs gap-1 hover:bg-primary/10">
                {task.value.targetCount > 1 ? (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden @min-[200px]:inline">
                      Progress
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="hidden @min-[200px]:inline">
                      Complete
                    </span>
                  </>
                )}
              </Button>
              <DatePicker
                targetCount={task.value.targetCount}
                taskId={task.value.id}
                taskCompletions={task.value.taskCompletions.map((c) => ({...c, completedAt: c.completedAt}))}
                onSave={handleCompletionSave}
                isScheduled={isScheduled}
                isCompleted={isCompleted}
              />
            </div>
          )}

          {/* Compact version just has a complete button */}
          {compact && !isCompleted && (
            <Button
              onClick={handleComplete}
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0">
              {task.value.targetCount > 1 ? (
                <Plus className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        categoryId={task.value.categoryId}
        monthId={currentMonth?.value.id || null}
        isTemplateTask={false}
        readOnly={task.value.templateTaskId !== null}
        initialValues={{
          id: task.value.id,
          title: task.value.title,
          description: task.value.description || "",
          storyPoints: task.value.storyPoints,
          targetCount: task.value.targetCount,
          isFocused: task.value.isFocused,
          monthId: task.value.monthId,
          userIds: task.value.taskUsers.map((tu) => tu.userId),
        }}
      />
    </>
  );
}
