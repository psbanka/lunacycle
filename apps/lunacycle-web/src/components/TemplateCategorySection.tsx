import { EmptyState } from "@/components/EmptyState";
import { useLoadable } from "atom.io/react"
import { TemplateTaskCard } from "@/components/TemplateTaskCard";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from "lucide-react";
import { categoryByIdAtom, templateTasksByCategoryIdAtom, getCategoryPlaceholder } from "@/atoms"

type Props = {
  categoryId: string;
  handleAddTaskClick: (categoryId: string) => void;
};

export function TemplateCategorySection({ categoryId, handleAddTaskClick }: Props) {
  // All hooks must be called before any early returns
  const category = useLoadable(categoryByIdAtom, categoryId, getCategoryPlaceholder(categoryId));
  const templateTasks = useLoadable(templateTasksByCategoryIdAtom, categoryId, [])

  // Early returns after all hooks
  if (category.error) return null
  if (templateTasks instanceof Error) return null

  return (
    <div key={categoryId} className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          {category.value.emoji} {category.value.name}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => handleAddTaskClick(categoryId)}>
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>

      {templateTasks.value.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="This category doesn't have any tasks yet. Add your first task to get started."
          icon={<FolderPlus className="h-10 w-10 opacity-40" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateTasks.value.map((templateTask) => (
            <TemplateTaskCard
              key={templateTask.id}
              templateTask={templateTask}
            />
          ))}
        </div>
      )}

    </div>
  )
}