import { useState } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import { useTask } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import LunarPhase from "@/components/LunarPhase";
import CategorySection from "@/components/CategorySection";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import LunarCycleProgressBand from "@/components/LunarCycleProgressBand";
import CheckInSheet from "@/components/CheckInSheet";

export default function Home() {
  const { currentMonth, tasksByUser, loadingTasks } = useTask();
  const { user } = useAuth();
  const [showAddTask, setShowAddTask] = useState(false);

  // Get current date
  const currentDate = new Date();

  // Calculate days remaining in month
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const daysRemaining = lastDayOfMonth.getDate() - currentDate.getDate();
  if (loadingTasks || !currentMonth) {    return <LoadingScreen />;
  }

  // Filter tasks for "Up Next" section - pending tasks from user
  const pendingCategoryTasks = currentMonth.monthCategories
    .flatMap((mc) => mc.category?.categoryTasks ?? []) // FIXME: shouldn't need to do this
    .filter((ct) => ct.task.targetCount > ct.task.completedCount )
    
  // Filter tasks for "Recently Completed" section - completed tasks from user
  const completedCategoryTasks = currentMonth.monthCategories
    .flatMap((mc) => mc.category?.categoryTasks ?? []) // FIXME: shouldn't need to do this
    .filter((ct) => ct.task.targetCount === ct.task.completedCount)
    .slice(0, 5);

  if (loadingTasks) {
    return <LoadingScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{currentMonth.name}</h1>
          <p className="text-muted-foreground">
            {daysRemaining} days remaining in this lunar cycle
          </p>
        </div>

        <div className="flex items-center">
          <LunarPhase size="lg" />
        </div>
      </div>

      <div className="mb-8">
        <LunarCycleProgressBand className="shadow-md" />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="gap-1"
          onClick={() => setShowAddTask(true)}>
          <PlusCircle className="h-4 w-4" />
          Add Task
        </Button>

        <CheckInSheet />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Up Next</h2>

        {pendingCategoryTasks.length === 0 ? (
          <div className="glass-card p-8 text-center rounded-lg">
            <p className="text-muted-foreground">
              All caught up! No pending tasks.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddTask(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add a new task
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pendingCategoryTasks.slice(0, 4).map((task) => (
              <TaskCard key={task.taskId} categoryTask={task} />
            ))}
          </div>
        )}
      </div>

      {completedCategoryTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recently Completed</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {completedCategoryTasks.map((ct) => (
              <TaskCard key={ct.taskId} categoryTask={ct} compact className="w-56" />
            ))}
          </div>
        </div>
      )}

      <Separator className="my-8" />

      <h2 className="text-2xl font-semibold mb-6">Categories</h2>

      <div>
        {currentMonth.monthCategories.map((mc) => (
          <CategorySection key={mc?.categoryId} id={mc?.categoryId} />
        ))}
      </div>
    </div>
  );
}
