import { DayPicker } from "react-day-picker";
import type { ISO18601 } from "server/schema";
import { CalendarPlus } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import useLunarPhase from "@/hooks/useLunarPhase";

// -================================ HELPER FUNCTIONS

function toDayString(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function findDate(
  occupiedDates: Set<string>,
  completionDate: Date,
  end: Date,
  start: Date,
  direction = 1
) {
  let dayString = toDayString(completionDate);
  let newCompletionDate = new Date(completionDate);

  const dateIsBad = (x: string) =>
    occupiedDates.has(x) &&
    newCompletionDate <= end &&
    newCompletionDate >= start;

  while (dateIsBad(dayString)) {
    newCompletionDate.setDate(newCompletionDate.getDate() + direction); // Move to the next day
    dayString = toDayString(newCompletionDate);
  }

  const dayHasNotBeenChanged = dayString === toDayString(completionDate);
  const dayShouldBeChanged = dateIsBad(dayString);
  const failure = dayHasNotBeenChanged && dayShouldBeChanged;
  return failure ? null : dayString;
}

function pickUniqueDates(
  startDate: ISO18601,
  endDate: ISO18601,
  taskCompletions: TaskCompletion[]
) {
  if (!startDate || !endDate) return;

  const processedDates: Date[] = [];
  const occupiedDates = new Set<string>();

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Helper to normalize a date to the start of its day and get its string representation

  for (const completion of taskCompletions) {
    let completionDate = new Date(completion.completedAt);

    let dayString = findDate(occupiedDates, completionDate, end, start, 1);
    if (dayString === null) {
      dayString = findDate(occupiedDates, completionDate, end, start, -1);
    }
    if (dayString == null)
      throw new Error("could not find a place for this date");

    if (completionDate >= start && completionDate <= end) {
      occupiedDates.add(dayString);
      processedDates.push(completionDate);
    }
  }
  return Array.from(occupiedDates).map((x) => new Date(x));
}

// ======================================= COMPONENT

type TaskCompletion = {
  userId: string;
  completedAt: string;
};

type DatePickerProps = {
  targetCount: number;
  isScheduled: boolean;
  isCompleted: boolean;
  taskCompletions: TaskCompletion[];
  onSave: (dates: Date[]) => void;
};

export function DatePicker({
  targetCount,
  isScheduled,
  isCompleted,
  taskCompletions,
  onSave,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date[]>();
  const [variant, setVariant] = useState<"ghost" | "outline" | "destructive">("ghost");

  const { startDate, endDate } = useLunarPhase();

  const handleSave = () => {
    if (selected === undefined) return;
    onSave(selected);
  };

  const handleCancel = () => {
    // Just re-run default setup
    const processedDates = pickUniqueDates(startDate, endDate, taskCompletions);
    setSelected(processedDates);
  };

  useEffect(() => {
    const processedDates = pickUniqueDates(startDate, endDate, taskCompletions);
    if (processedDates === undefined) return;
    setSelected(processedDates);
    
    const variant = isCompleted ? "ghost" : isScheduled ? "outline" : "destructive";
    setVariant(variant);
  }, [taskCompletions, startDate, endDate]);

  function onOpenChange() {
    setOpen(!open);
  }
  function swallowClicks(e) {
    e.stopPropagation();
  }
  const isMobile = useMediaQuery("(max-width: 640px)"); // Tailwind's 'sm' breakpoint

  const disabledDays = useMemo(() => {
    // new Date(string) can be unreliable. If the format from the hook is not
    // ISO 8601, this might need a more robust parsing solution.
    return { before: new Date(startDate), after: new Date(endDate) };
  }, [startDate, endDate]);

  const startMonth = useMemo(() => new Date(startDate), [startDate]);

  return (
    <div onClick={swallowClicks}>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange();
        }}
        size="sm"
        className="text-xs gap-1 hover:bg-primary/10"
        variant={variant}>
        <CalendarPlus />
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTitle />
        <DialogContent
          className={cn(
            "overflow-y-auto", // Ensure content can scroll
            isMobile
              ? "h-screen w-screen max-w-full fixed top-0 left-0 m-0 p-4 rounded-none border-none translate-x-0 translate-y-0 data-[state=open]:animate-none data-[state=closed]:animate-none"
              : "sm:max-w-3xl mx-auto"
          )}>
          <DialogHeader>
            <h1 className="text-center text-xl font-semibold">
              Select up to {targetCount} days
            </h1>
          </DialogHeader>
          <DayPicker
            mode="multiple"
            min={1}
            max={targetCount}
            month={startMonth}
            numberOfMonths={2}
            selected={selected}
            onSelect={setSelected}
            disabled={disabledDays}
            modifiers={{ future: (date) => date > new Date() }}
            modifiersClassNames={{
              future: "rdp-day_future",
            }}
            className={cn(
              "flex justify-center",
              isMobile && "[&_.rdp-months]:flex-col"
            )}
          />
          <DialogClose asChild>
            <div className="flex flex-row">
              <Button
                onClick={handleSave}
                type="button"
                className="flex-grow gap-1 hover:bg-primary/10"
                variant="default">
                Save
              </Button>
              <Button
                onClick={handleCancel}
                type="button"
                className="flex-grow gap-1 hover:bg-primary/10"
                variant="secondary">
                Cancel
              </Button>
            </div>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
