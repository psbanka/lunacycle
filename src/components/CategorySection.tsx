import TaskCard from "./TaskCard";
import { useLoadable } from "atom.io/react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTask } from "@/contexts/TaskContext";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { useState } from "react";
import { categoryAtoms, currentTasksByCategoryIdAtom, currentTaskIdsAtom, currentMonthAtom, EMPTY_MONTH, FAKE_CATEGORY } from "@/atoms";

type CategorySectionProps = {
  categoryId: string;
  isTemplate: boolean;
};

export default function CategorySection({ categoryId, isTemplate }: CategorySectionProps) {
  const tasks = useLoadable(currentTasksByCategoryIdAtom, categoryId, []);
  const currentMonth = useLoadable(currentMonthAtom, EMPTY_MONTH);
  const category = useLoadable(categoryAtoms, categoryId, FAKE_CATEGORY);
  const { addTask } = useTask();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  if (currentMonth instanceof Error || category instanceof Error) return null;
  if (category === undefined || category.value === undefined) return null;
  if (tasks instanceof Error || tasks.value == undefined) return null

  return (
    <div className="mb-8">
      <EditTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        monthId={currentMonth.value.id}
        isTemplateTask={isTemplate}
        categoryId={categoryId}
      />
      <div className="mb-4 flex justify-around items-center">
        <h2 className="text-xl font-semibold">
          {category.value.emoji} {category.value.name}
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
        {!tasks || tasks.value.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tasks in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.value
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
