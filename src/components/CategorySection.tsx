import { useAuth } from "@/contexts/AuthContext";
import TaskCard from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Category } from "../../server/schema";
import { useTask } from "@/contexts/TaskContext";


type CategorySectionProps = {
  category: Category;
  onAddTask?: (categoryId: string) => void;
};

export default function CategorySection({ category, onAddTask }: CategorySectionProps) {
  const { user } = useAuth();
  const { currentMonth, taskUsers } = useTask();
  if (!currentMonth || !taskUsers) return null;
  
  // Filter tasks that are assigned to the current user
  const userTasks = taskUsers.filter(tu => tu.userId === user?.id)
  const categoryMonth = currentMonth.monthCategories.find(mc => mc.category.id === category.id);
  if (!categoryMonth) return null;
    
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
      
      {categoryMonth.category.categoryTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tasks in this category yet.</p>
      ) : userTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tasks assigned to you in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userTasks.map(userTask => (
            <TaskCard key={userTask.taskId} userTask={userTask} />
          ))}
        </div>
      )}
    </div>
  );
}
