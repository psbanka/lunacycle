import TaskCard from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTask } from "@/contexts/TaskContext";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { useState } from "react";
import type { Task } from "../../server/schema";

type CategorySectionProps = {
  id: string;
  isTemplate: boolean;
};

export default function CategorySection({ id, isTemplate }: CategorySectionProps) {
  const { addTask, categories, currentTasks, currentMonth } = useTask();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  if (!currentMonth) return null;

  const category = categories?.find((category) => category.id === id);
  const tasks = currentTasks?.filter((task) => task.categoryId === id);

  return (
    <div className="mb-8">
      <EditTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        monthId={currentMonth.id}
        isTemplateTask={isTemplate}
        categoryId={id}
      />
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {category?.emoji} {category?.name}
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
        {!tasks || tasks?.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tasks in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((task) => (
              <TaskCard key={task.id} taskId={task.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
