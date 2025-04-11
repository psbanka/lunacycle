
import type { Task, Category } from "../../server/schema";
import { useTask, type UserTask } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle, CheckSquare, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";

type TaskCardProps = {
  userTask: UserTask;
  compact?: boolean;
  className?: string;
};

export default function TaskCard({ userTask, compact = false, className }: TaskCardProps) {
  const { completeTask, taskUsers, tasks } = useTask();
  const { user } = useAuth();
  const trpc = useTRPC();
  
  const task = tasks?.find(t => t.id === userTask.taskId);
  if (!task) return null;
  
  // const isAssignedToUser = user && Boolean(task.assignedTo.find((u) => u.id === user.id));
  const isAssignedToUser = Boolean(taskUsers?.find(tu => tu.userId === user?.id && tu.taskId === userTask.taskId));
  const isCompleted = task.targetCount === task.completedCount;
  const progress = task.targetCount > 0 ? (task.completedCount / task.targetCount) * 100 : 0;
  
  // Fibonacci numbers for story points badge color
  const getStoryPointsColor = (points: number) => {
    switch (points) {
      case 1: return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case 2: return "bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100";
      case 3: return "bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100";
      case 5: return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case 8: return "bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100";
      case 13: return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      case 21: return "bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };
  
  const handleComplete = () => {
    completeTask(task.id);
  };
  
  return (
    <div 
      className={cn(
        "group relative p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md",
        isCompleted 
          ? "bg-secondary/50 border border-secondary" 
          : "glass-card hover:shadow-md",
        compact ? "w-full max-w-[200px]" : "w-full",
        className
      )}
    >
      {/* Task Details */}
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className={cn(
            "font-medium transition-colors",
            isCompleted ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {task.title}
          </h3>
          
          {/* Story Points Badge */}
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            getStoryPointsColor(task.storyPoints)
          )}>
            {task.storyPoints} SP
          </span>
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
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleComplete}
              variant="ghost" 
              size="sm"
              className="text-xs gap-1 hover:bg-primary/10"
            >
              {task.targetCount > 1 ? (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add progress
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Mark complete
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
            className="absolute top-1 right-1 h-6 w-6 p-0"
          >
            {task.targetCount > 1 ? (
              <Plus className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
