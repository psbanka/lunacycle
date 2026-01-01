import { useState } from "react";
import { useLoadable } from "atom.io/react";
import LunarPhase from "@/components/Moon";
import CategorySection from "@/components/CategorySection";
import TaskCard from "@/components/TaskCard";
import { Separator } from "@/components/ui/separator";
import { LoadIndicator } from "@/components/LoadIndicator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  focusedTaskIdsAtom,
  currentMonthAtom,
  categoryIdsAtom,
  getPlaceholderMonth,
} from "@/atoms";

export default function Home() {
  const [view, setView] = useState<"task" | "calendar">("task");
  const currentMonth = useLoadable(currentMonthAtom, getPlaceholderMonth());
  const focusedTaskIds = useLoadable(focusedTaskIdsAtom, []);
  const categoryIds = useLoadable(categoryIdsAtom, []);

  if (!currentMonth.value) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              No Current Month Exists. Go to Planning screen to create
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-row items-center justify-between mb-8 gap-4">
        <div className="flex flex-row items-start gap-4">
          <h1 className="text-left text-3xl font-bold">
            {currentMonth.value.name}
          </h1>
          <ToggleGroup
            type="single"
            defaultValue="task"
            value={view}
            onValueChange={(value: "task" | "calendar") => {
              if (value) setView(value);
            }}
          >
            <ToggleGroupItem value="task">Task</ToggleGroupItem>
            <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-4">
          <LunarPhase size="lg" />
        </div>
      </div>

      {view === "task" ? (
        <>
          <div className="mb-8">
            <LoadIndicator />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Up Next</h2>

            {focusedTaskIds.value.length === 0 ? (
              <div className="glass-card p-8 text-center rounded-lg">
                <p className="text-muted-foreground">
                  All caught up! No focused tasks.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {focusedTaskIds.value.map((taskId) => (
                  <TaskCard key={taskId} taskId={taskId} />
                ))}
              </div>
            )}
          </div>

          <Separator className="my-8" />

          <h2 className="text-2xl font-semibold mb-6">Categories</h2>

          <div>
            {categoryIds.value.sort().map((categoryId) => (
              <div key={categoryId} id={categoryId}>
                <CategorySection categoryId={categoryId} isTemplate={false} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
