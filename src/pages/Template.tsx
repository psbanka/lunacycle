import { useState } from "react";
import { useTask } from "@/contexts/TaskContext";
import LunarPhase from "@/components/LunarPhase";
import LunarCycleProgressBand from "@/components/LunarCycleProgressBand";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, FolderPlus } from "lucide-react";
import { AddTemplateCategoryDialog } from "@/components/AddTemplateCategoryDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { EmptyState } from "@/components/EmptyState";
import { TemplateTaskCard } from "@/components/TemplateTaskCard";

export default function Template() {
  const { template, loadingTasks } = useTask();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<
    string | null
  >(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Function to handle opening the AddTaskDialog
  const handleAddTaskClick = (templateCategoryId: string) => {
    setActiveTemplateCategory(templateCategoryId);
    setIsAddTaskOpen(true);
  };

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

  const templateCategories = template?.templateTemplateCategories ?? [];

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

        <AddTemplateCategoryDialog
          open={isAddCategoryOpen}
          onOpenChange={setIsAddCategoryOpen}
        />

        {activeTemplateCategory && (
          <AddTaskDialog
            open={isAddTaskOpen}
            onOpenChange={setIsAddTaskOpen}
            templateCategoryId={activeTemplateCategory}
          />
        )}
      </div>

      <Separator className="my-8" />

      {/* FIXME: Make this a bit bolder */}
      {templateCategories.map((tc) => (
        <div key={tc.templateCategoryId} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {tc.templateCategory.emoji} {tc.templateCategory.name}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => handleAddTaskClick(tc.templateCategory.id)}>
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>

          {tc.templateCategory.templateCategoryTemplateTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="This category doesn't have any tasks yet. Add your first task to get started."
              icon={<FolderPlus className="h-10 w-10 opacity-40" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tc.templateCategory.templateCategoryTemplateTasks.map((tctc) => (
                <TemplateTaskCard
                  key={tctc.templateTaskId}
                  templateCategoryTemplateTask={tctc}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {templateCategories.length === 0 && (
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
