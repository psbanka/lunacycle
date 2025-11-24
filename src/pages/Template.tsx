import { useLoadable } from "atom.io/react";
import { EmptyState } from "@/components/EmptyState";
import { useState, useRef } from "react";
import { useTask } from "@/contexts/TaskContext";
import LunarPhase from "@/components/Moon";
import LunarCycleProgressBand from "@/components/LunarCycleProgressBand";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, FolderPlus } from "lucide-react";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { TemplateCategorySection } from "@/components/TemplateCategorySection";
import { categoryIdsAtom } from "@/atoms";

export default function Template() {
  const categoryIds = useLoadable(categoryIdsAtom, [])
  const { templateTasks, loadingTasks, currentMonth } = useTask();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const categoryRefs = useRef<(HTMLElement | null)[]>([]);

  // Function to scroll to a category

  // Function to handle opening the EditTaskDialog
  const handleAddTaskClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setIsAddTaskOpen(true);
  };

  if (categoryIds.error) return null
  if (loadingTasks) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <LunarPhase size="lg" />
          <p className="mt-4 text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!templateTasks) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Template Header */}
      <div className="flex flex-row  justify-between mb-8 gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold">Monthly Template</h1>
          <p className="text-muted-foreground">
            Define recurring tasks and general categories for your lunar cycles
          </p>
        </div>
        <div className="flex items-center">
          <LunarPhase size="lg" />
        </div>
      </div>

      {/* Lunar Cycle Progress Band */}
      <div className="mb-8">
        <LunarCycleProgressBand className="shadow-md" />
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="gap-1"
          onClick={() => setIsAddCategoryOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>

        <AddCategoryDialog
          open={isAddCategoryOpen}
          onOpenChange={setIsAddCategoryOpen}
        />

        {activeCategory && (
          <EditTaskDialog
            monthId={currentMonth?.id || null}
            isTemplateTask={true}
            open={isAddTaskOpen}
            onOpenChange={setIsAddTaskOpen}
            categoryId={activeCategory}
          />
        )}
      </div>

      <Separator className="my-8" />

      {categoryIds.value.map((categoryId) => (
        <TemplateCategorySection
          key={categoryId}
          categoryId={categoryId}
          handleAddTaskClick={handleAddTaskClick}
        />
      ))}
      {categoryIds.value.length === 0 && (
        <EmptyState
          title="No categories defined yet"
          description="Create your first category to start organizing your monthly tasks."
          icon={<FolderPlus className="h-12 w-12 opacity-40" />}
          action={
            <Button
              variant="outline"
              onClick={() => setIsAddCategoryOpen(true)}
              className="gap-1">
              <Plus className="h-4 w-4" />
              Add First Category
            </Button>
          }
        />
      )}
    </div>
  );
}
