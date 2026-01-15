import { useState } from "react";
import { useLoadable } from "atom.io/react";
import LunarPhase from "@/components/Moon";
import { TaskView } from "@/components/TaskView";
import { CalendarView } from "@/components/CalendarView";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  focusedTaskIdsAtom,
  currentMonthAtom,
  getPlaceholderMonth,
} from "@/atoms";

export default function Home() {
  const [view, setView] = useState<"task" | "calendar">("task");
  const currentMonth = useLoadable(currentMonthAtom, getPlaceholderMonth());

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

      {view === "task" ? <TaskView /> : <CalendarView />}
    </div>
  );
}
