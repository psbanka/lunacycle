import { useRef } from "react";
import { useTask } from "@/contexts/TaskContext";
import LunarPhase from "@/components/Moon";
import CategorySection from "@/components/CategorySection";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import LunarCycleProgressBand from "@/components/LunarCycleProgressBand";
import CheckInSheet from "@/components/CheckInSheet";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Home() {
  const { currentMonth, loadingTasks, createMonthFromTemplate, users } = useTask();
  const categoryRefs = useRef<(HTMLElement | null)[]>([]);

  // Function to scroll to a category
  // const scrollToCategory = (index: number) => {
  //   categoryRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  if (loadingTasks) {
    return <LoadingScreen />;
  }

  if (!currentMonth) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">No Current Month Exists</h1>
            <div className="mb-8 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => createMonthFromTemplate()}>
                <PlusCircle className="h-4 w-4" />
                Create Month
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter tasks for "Up Next" section - pending tasks from user
  const pendingCategoryTasks = currentMonth.monthCategories
    .flatMap((mc) => mc.category?.categoryTasks ?? []) // FIXME: shouldn't need to do this
    .filter((ct) => ct.task.targetCount > ct.task.completedCount);

  const upNextTasks = pendingCategoryTasks.filter(ct => ct.task.isFocused === 1);

  // Filter tasks for "Recently Completed" section - completed tasks from user
  const completedCategoryTasks = currentMonth.monthCategories
    .flatMap((mc) => mc.category?.categoryTasks ?? []) // FIXME: shouldn't need to do this
    .filter((ct) => ct.task.targetCount === ct.task.completedCount)
    .slice(0, 5);

  if (loadingTasks) {
    return <LoadingScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto pl-8">
      <div className="flex flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-left text-3xl font-bold">{currentMonth.name}</h1>
        </div>

        <div className="flex items-center">
          <LunarPhase size="lg" />
        </div>
      </div>

      <div className="mb-8">
        <LunarCycleProgressBand className="shadow-md" />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <CheckInSheet />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Up Next</h2>

        {upNextTasks.length === 0 ? (
          <div className="glass-card p-8 text-center rounded-lg">
            <p className="text-muted-foreground">
              All caught up! No focused tasks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {upNextTasks.map((task) => (
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
              <TaskCard
                key={ct.taskId}
                categoryTask={ct}
                compact
                className="w-56"
              />
            ))}
          </div>
        </div>
      )}

      <Separator className="my-8" />

      <h2 className="text-2xl font-semibold mb-6">Categories</h2>

      <div>
        {currentMonth.monthCategories
          .sort((a, b) => a.category.name.localeCompare(b.category.name))
          .map((mc) => (
            <div
              key={mc?.categoryId}
              id={mc?.categoryId}
            >
              <CategorySection id={mc?.categoryId} />
            </div>
          ))}
      </div>
    </div>
  );
}
