
import { useTask } from "@/contexts/TaskContext";
import LunarPhase from "@/components/LunarPhase";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import TaskCard from "@/components/TaskCard";

export default function Template() {
  const { currentMonth, categories, loadingTasks } = useTask();

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
      
      {/* Add Category Button */}
      <div className="mb-8">
        <Button variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>
      
      <Separator className="my-8" />
      
      {/* Categories */}
      {categories.map(category => (
        <div key={category.id} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
          
          {category.tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tasks in this category yet.</p>
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
        <div className="glass-card p-8 text-center rounded-lg">
          <p className="text-muted-foreground">No categories defined yet. Create one to get started.</p>
        </div>
      )}
    </div>
  );
}
