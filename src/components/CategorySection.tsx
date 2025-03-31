
import { Category, Task } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import TaskCard from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type CategorySectionProps = {
  category: Category;
  onAddTask?: (categoryId: string) => void;
};

export default function CategorySection({ category, onAddTask }: CategorySectionProps) {
  const { user } = useAuth();
  
  // Filter tasks that are assigned to the current user
  const userTasks = user 
    ? category.tasks.filter(task => task.assignedTo.includes(user.id))
    : [];
  
  return (
    <div className="mb-8">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{category.name}</h2>
        
        {onAddTask && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAddTask(category.id)}
            className="text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        )}
      </div>
      
      {category.tasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tasks in this category yet.</p>
      ) : userTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tasks assigned to you in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
