import { useState, useEffect } from "react";
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
  const { currentMonth, loadingTasks, createMonthFromTemplate } = useTask();
  const [showAddTask, setShowAddTask] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  // Get current date
  const currentDate = new Date();

  useEffect(() => {
    const calculateDaysUntilNextFullMoon = () => {
      const getLunarPhase = (date: Date): { phase: string; name: string } => {
        // Known new moon date for reference
        const knownNewMoon = new Date('2023-06-18');
        const daysSinceKnownNewMoon = Math.floor(
          (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Normalize to get position in current cycle (0 to 29.53)
        const dayInCycle = (daysSinceKnownNewMoon % 29.53);
        
        // Convert to a position in the cycle from 0 to 1
        const cyclePosition = dayInCycle / 29.53;
        
        // Determine phase
        if (cyclePosition < 0.025) return { phase: 'new-moon', name: 'New Moon' };
        if (cyclePosition < 0.25) return { phase: 'waxing-crescent', name: 'Waxing Crescent' };
        if (cyclePosition < 0.275) return { phase: 'first-quarter', name: 'First Quarter' };
        if (cyclePosition < 0.475) return { phase: 'waxing-gibbous', name: 'Waxing Gibbous' };
        if (cyclePosition < 0.525) return { phase: 'full-moon', name: 'Full Moon' };
        if (cyclePosition < 0.725) return { phase: 'waning-gibbous', name: 'Waning Gibbous' };
        if (cyclePosition < 0.775) return { phase: 'last-quarter', name: 'Last Quarter' };
        if (cyclePosition < 0.975) return { phase: 'waning-crescent', name: 'Waning Crescent' };
        return { phase: 'new-moon', name: 'New Moon' };
      };

      const daysInLunarCycle = 29.53;
      const { phase: currentPhase } = getLunarPhase(currentDate);

      if (currentPhase === 'full-moon') {
        setDaysRemaining(0);
        return;
      }

      let daysUntilFullMoon = 0;
      const tempDate = new Date(currentDate);
      while (daysUntilFullMoon < daysInLunarCycle) {
        tempDate.setDate(tempDate.getDate() + 1);
        const { phase } = getLunarPhase(tempDate);
        daysUntilFullMoon++;
        if (phase === 'full-moon') {
          setDaysRemaining(daysUntilFullMoon);
          return;
        }
      }
    };

    calculateDaysUntilNextFullMoon();
  }, [currentDate]);

  if (loadingTasks) {    return <LoadingScreen />;
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
          <h1 className="text-left text-3xl font-bold">{currentMonth.name}</h1>
          <p className="text-muted-foreground">
            {daysRemaining} days until the next full moon
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
