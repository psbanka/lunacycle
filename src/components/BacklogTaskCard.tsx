import { useTask } from "@/contexts/TaskContext";
import { cn } from "@/lib/utils";
import { Trash, CheckSquare, ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditTaskDialog } from "./EditTaskDialog";
import { UserAvatar } from "./UserAvatar";
import { StoryPointsBadge } from "./StoryPointsBadge";

type TaskCardProps = {
  taskId: string;
  className?: string;
};

export default function BacklogTaskCard({ taskId, className }: TaskCardProps) {
  const { backlogTasks, loadingTasks, updateTask, currentMonth, deleteTask } = useTask();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const task = backlogTasks
    ?.flatMap((blt) => blt.tasks)
    .find((task) => task.id === taskId);

  if (!task) return null;

  const isAssignedToUser = true;
  const isCompleted = task.targetCount === task.completedCount;
  const progress =
    task.targetCount > 0 ? (task.completedCount / task.targetCount) * 100 : 0;

  const isContinuingTask = task.targetCount > 1;

  function promoteToMonth() {
    const task = backlogTasks
      ?.flatMap((blt) => blt.tasks)
      .find((task) => task.id === taskId);
    if (!currentMonth) return;
    if (!task) return;
    updateTask(
      taskId,
      {
        ...task,
        monthId: currentMonth?.id,
      },
      task.taskUsers.map((tu) => tu.userId)
    );
  }

  function handleDelete() {
    deleteTask(taskId);
  }

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const isFocused = task.isFocused;

  return (
    <>
      <div
        className={cn(
          "group relative p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer",
          isCompleted
            ? "bg-secondary/50 border border-secondary"
            : "glass-card hover:shadow-md",
          isContinuingTask &&
            !isCompleted &&
            "border-6 border-secondary/50 bg-primary/5",
          isFocused && "ring-2 ring-primary/70",
          className
        )}
        onClick={handleEditClick}>
        {/* Task Details */}
        <div className="flex flex-col h-full justify-between">
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

          {/* Actions */}
          {isAssignedToUser && !isCompleted && (
            <div className="mt-4 flex justify-between items-center">
              <div className="flex -space-x-2 avatar-container">
                {task.taskUsers.map((tu) => (
                  <UserAvatar key={tu.userId} user={tu.user} dimmed={true} />
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={promoteToMonth}
                  className="text-xs gap-1 hover:bg-primary/10">
                  <ArrowUpToLine className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="text-xs gap-1 hover:bg-primary/10">
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
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
