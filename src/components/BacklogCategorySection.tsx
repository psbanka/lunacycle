import BacklogTaskCard from "@/components/BacklogTaskCard";
import { useLoadable } from "atom.io/react"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { backlogTasksByCategoryIdAtom, categoryByIdAtom, FAKE_CATEGORY } from "@/atoms"

type Props = {
  categoryId: string;
};

export function BacklogCategorySection({ categoryId }: Props) {
  const backlogTasks = useLoadable(backlogTasksByCategoryIdAtom, categoryId, [])
  const category = useLoadable(categoryByIdAtom, categoryId, FAKE_CATEGORY)
  if (category instanceof Error) return null

  return (
    <div>
      <div className="mb-8" key={categoryId}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {category.value.emoji} {category.value.name}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log("todo")}
            className="text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        </div>

        <div className="md:glass-card md:bg-secondary/30 p-4 rounded-lg">
          {backlogTasks.value.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tasks in this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backlogTasks.value
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((task) => (
                  <BacklogTaskCard
                    key={task.id}
                    task={task}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}