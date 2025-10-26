import { useTask } from "@/contexts/TaskContext";
import { cn } from "@/lib/utils";
import { CheckCircle, CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditTaskDialog } from "./EditTaskDialog";
import { StoryPointsBadge } from "./StoryPointsBadge";
import { UserAvatar } from "./UserAvatar";

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
  const { completeTask, currentMonth, currentTasks } = useTask();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const task = currentTasks?.find((task) => task.id === taskId);
  if (!task) return null;

  // FIXME
  // const isAssignedToUser = user && Boolean(task.assignedTo.find((u) => u.id === user.id));
  // const isAssignedToUser = Boolean(taskUsers?.find(tu => tu.userId === user?.id && tu.taskId === userTask.taskId));
  const isAssignedToUser = true;
  const isCompleted = task.targetCount === task.completedCount;
  const progress =
    task.targetCount > 0 ? (task.completedCount / task.targetCount) * 100 : 0;
  
  const isContinuingTask = task.targetCount > 1;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from propagating to the parent div
    completeTask(task.id);
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const isFocused = task.isFocused;

  return (
    <>
      <div
        className={cn(
          "@container group relative p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer",
          isCompleted
            ? "bg-secondary/50 border border-secondary"
            : "glass-card hover:shadow-md",
          isContinuingTask && !isCompleted && "border-6 border-secondary/50 bg-primary/5",
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
              {task.title}
            </h3>

            <StoryPointsBadge storyPoints={task.storyPoints} />
          </div>

          {/* Counter for tasks that need to be done multiple times */}
          {task.targetCount > 1 && (
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckSquare className="h-4 w-4 mr-1" />
                <span>
                  {task.completedCount} / {task.targetCount}
                </span>
              </div>

              {/* Progress bar */}
              <div className="ml-2 flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {isAssignedToUser && !compact && !isCompleted && (
            <div className="mt-4 flex justify-between items-center">
              <div className="flex -space-x-2 avatar-container">
                {(task.taskUsers).map((tu) => (
                  <UserAvatar
                    key={tu.userId}
                    user={tu.user}
                    dimmed={true}
                  />
                ))}
              </div>

              <Button
                onClick={handleComplete}
                variant="ghost"
                size="sm"
                className="text-xs gap-1 hover:bg-primary/10">
                {task.targetCount > 1 ? (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden @min-[180px]:inline">Add progress</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="hidden @min-[180px]:inline">Mark complete</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Compact version just has a complete button */}
          {isAssignedToUser && compact && !isCompleted && (
            <Button
              onClick={handleComplete}
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0">
              {task.targetCount > 1 ? (
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
        categoryId={task.categoryId}
        monthId={currentMonth?.id || null}
        isTemplateTask={false}
        initialValues={{
          id: task.id,
          title: task.title,
          description: task.description || "",
          storyPoints: task.storyPoints,
          targetCount: task.targetCount,
          isFocused: task.isFocused,
          completedCount: task.completedCount,
          monthId: task.monthId,
          userIds: task.taskUsers.map((tu) => tu.userId),
        }}
      />
    </>
  );
}
