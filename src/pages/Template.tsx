
import { useState } from "react";
import { useTask } from "@/contexts/TaskContext";
import LunarPhase from "@/components/LunarPhase";
import LunarCycleProgressBand from "@/components/LunarCycleProgressBand";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, FolderPlus } from "lucide-react";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { EmptyState } from "@/components/EmptyState";
import CheckInSheet from "@/components/CheckInSheet";

export default function Template() {
  const { currentMonth, categories, loadingTasks } = useTask();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Function to handle opening the AddTaskDialog
  const handleAddTaskClick = (categoryId: string) => {
    setActiveCategory(categoryId);
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Template Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
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
          onClick={() => setIsAddCategoryOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
        
        <CheckInSheet />
        
        <AddCategoryDialog 
          open={isAddCategoryOpen} 
          onOpenChange={setIsAddCategoryOpen} 
        />

        {activeCategory && (
          <AddTaskDialog
            open={isAddTaskOpen}
            onOpenChange={setIsAddTaskOpen}
            categoryId={activeCategory}
          />
        )}
      </div>
      
      <Separator className="my-8" />
      
      {/* Categories */}
      {categories.map(category => (
        <div key={category.id} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 text-xs"
              onClick={() => handleAddTaskClick(category.id)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
          
          {category.tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="This category doesn't have any tasks yet. Add your first task to get started."
              icon={<FolderPlus className="h-10 w-10 opacity-40" />}
              action={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-xs"
                  onClick={() => handleAddTaskClick(category.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Task
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.tasks.map(task => (
                <div 
                  key={task.id} 
                  className="glass-card p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                      {task.storyPoints} SP
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {task.targetCount > 1 ? (
                      <p>Do {task.targetCount} times per month</p>
                    ) : (
                      <p>One-time task</p>
                    )}
                  </div>
                  
                  <div className="mt-2 flex gap-1">
                    {task.assignedTo.map(userId => {
                      // This would typically use real user data
                      const assigneeNames: Record<string, string> = {
                        '1': 'Admin',
                        '2': 'User',
                        '3': 'Family'
                      };
                      
                      return (
                        <div 
                          key={userId}
                          className="bg-accent text-xs px-2 py-0.5 rounded-full"
                        >
                          {assigneeNames[userId] || 'User'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {categories.length === 0 && (
        <EmptyState
          title="No categories defined yet"
          description="Create your first category to start organizing your monthly tasks."
          icon={<FolderPlus className="h-12 w-12 opacity-40" />}
          action={
            <Button 
              variant="outline" 
              onClick={() => setIsAddCategoryOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add First Category
            </Button>
          }
        />
      )}
    </div>
  );
}
