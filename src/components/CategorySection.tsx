import { useAuth } from "@/contexts/AuthContext";
import TaskCard from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTask } from "@/contexts/TaskContext";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

type CategorySectionProps = {
  id: string;
};

export default function CategorySection({ id }: CategorySectionProps) {
  const { addTask, currentMonth } = useTask();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  if (!currentMonth) return null;

  const categoryMonth = currentMonth.monthCategories.find(
    (mc) => mc.category?.id === id
  );
  if (!categoryMonth) return null;
  const categoryTasks = categoryMonth.category.categoryTasks;

  return (
    <div className="mb-8">
      <EditTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        categoryId={id}
      />
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {categoryMonth.category?.emoji} {categoryMonth.category?.name}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddTaskOpen(true)}
          className="text-xs gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>

      <div className="md:glass-card md:bg-secondary/30 p-4 rounded-lg">
        {categoryTasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tasks in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTasks.map((ct) => (
              <TaskCard key={ct.taskId} categoryTask={ct} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
