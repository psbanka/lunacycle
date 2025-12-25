import TaskCard from "./TaskCard";
import { useLoadable } from "atom.io/react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { useState } from "react";
import { categoriesAtom, currentTasksByCategoryIdAtom, currentMonthAtom, getPlaceholderMonth, getCategoryPlaceholder } from "@/atoms";

type CategorySectionProps = {
  categoryId: string;
  isTemplate: boolean;
};

const FOO_TASK_ID = "c8a02c62-bcad-4f22-96b6-cb8c385162a0"
const COMMUNITY_CATEGORY_ID = "243b3bc5-0319-40ce-b84b-b5906f69eaca"
/*
  issue:
  1. edit FOO_TASK_ID so that it no longer has a monthId.
  2. that should result in the task disappearing from this view:
    a. calls updateTask() in appRouter.
    b. server updates task to remove the monthId
    c. server sends clearCache for `currentTaskIds`
    d. client receives the message and calls `resetState(currentTaskIdsAtom)`
    e. this component relies on `useLoadable(currentTasksByCategoryIdAtom)` for the COMMUNITY_CATEGORY_ID
    f. currentTasksByCategoryIdAtom is a selectorFamily that depends on currentTaskIdsAtom
    g. currentTaskIdsAtom performs a trpc call to getCurrentMonthTasks and sets currentTasksAtom for that FOO_TASK_ID

  What actually happens:
  1. calls updateTask() in appRouter
  2. server sends clearCache for `currentTaskIds`
  3. this component receives new tasks, with foo in the list with the monthId set to null
     despite the fact that currentMonthTasks does not have foo in the list
  4. AND the currentTasksByCategoryIdAtom is never re-run.
*/


export default function CategorySection({ categoryId, isTemplate }: CategorySectionProps) {
  const tasks = useLoadable(currentTasksByCategoryIdAtom, categoryId, []);
  if (tasks.loading === false && categoryId === COMMUNITY_CATEGORY_ID) {
    console.log(tasks.value)
    debugger
  }
  const currentMonth = useLoadable(currentMonthAtom, getPlaceholderMonth());
  const category = useLoadable(categoriesAtom, categoryId, getCategoryPlaceholder(categoryId));
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
