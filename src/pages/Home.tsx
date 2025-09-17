import { useTask } from "@/contexts/TaskContext";
import LunarPhase from "@/components/Moon";
import CategorySection from "@/components/CategorySection";
import TaskCard from "@/components/TaskCard";
import { Separator } from "@/components/ui/separator";
import LunarCycleProgressBand from "@/components/LunarCycleProgressBand";
import { LoadIndicator } from "@/components/LoadIndicator";
import { LoadingScreen } from "@/components/LoadingScreen";
import useLunarPhase from "@/hooks/useLunarPhase";

export default function Home() {
  const {
    currentMonth,
    currentTasks,
    categories,
    loadingTasks,
  } = useTask();
  const { inModificationWindow } = useLunarPhase();

  // Function to scroll to a category
  // const scrollToCategory = (index: number) => {
  //   categoryRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  if (loadingTasks) {
    return <LoadingScreen />;
  }

  if (!currentMonth || !currentTasks || !categories) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">No Current Month Exists. Go to Planning screen to create</h1>
          </div>
        </div>
      </div>
    );
  }

  // Filter tasks for "Up Next" section - pending tasks from user
  const pendingTasks = currentTasks.filter(
    (task) => task.targetCount > task.completedCount
  );

  const upNextTasks = pendingTasks.filter((task) => task.isFocused === 1);

  // Filter tasks for "Recently Completed" section - completed tasks from user
  const completedTasks = currentTasks
    .filter((task) => task.targetCount === task.completedCount)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-left text-3xl font-bold">{currentMonth.name}</h1>
        </div>

        <div className="flex items-center">
          <LunarPhase size="lg" />
        </div>
      </div>

      <div className="mb-8">
        {inModificationWindow ? (
          <LoadIndicator />
        ) : (
          <LunarCycleProgressBand className="shadow-md" />
        )}
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
              <TaskCard key={task.id} taskId={task.id} />
            ))}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recently Completed</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                taskId={task.id}
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
        {categories
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((category) => (
            <div key={category?.id} id={category?.id}>
              <CategorySection id={category.id} isTemplate={false} />
            </div>
          ))}
      </div>
    </div>
  );
}
