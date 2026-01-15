// src/components/DateTimeList.tsx

import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateTimeListProps = {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  activeDate: Date | undefined;
  onActiveDateChange: (date: Date | undefined) => void;
  isMobile: boolean;
};

export function DateTimeList({
  selectedDates,
  onDatesChange,
  activeDate,
  onActiveDateChange,
  isMobile,
}: DateTimeListProps) {
  const itemRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());
  const handleTimeChange = (dateToUpdate: Date, newTime: string) => {
    const [hours, minutes] = newTime.split(":").map(Number);
    const newDate = new Date(dateToUpdate);
    newDate.setHours(hours, minutes);

    const newDates = selectedDates.map((d) =>
      d.getTime() === dateToUpdate.getTime() ? newDate : d
    );
    onDatesChange(newDates);
    onActiveDateChange(newDate); // Keep the just-edited date active
  };

  const handleDelete = (dateToDelete: Date) => {
    const newDates = selectedDates.filter(
      (d) => d.getTime() !== dateToDelete.getTime()
    );
    onDatesChange(newDates);
    if (activeDate?.getTime() === dateToDelete.getTime()) {
      onActiveDateChange(undefined);
    }
  };

  useEffect(() => {
    if (activeDate) {
      const node = itemRefs.current.get(activeDate.toISOString());
      if (node) {
        node.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeDate]);
  if (!selectedDates || selectedDates.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a date to begin.
      </div>
    );
  }

  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

  return (
    <div
      className={cn(
        "space-y-2 p-2 border-t sm:border-t-0 sm:border-l",
        "sm:max-h-[420px] sm:overflow-y-auto",
        isMobile && "max-h-[150px] overflow-y-auto" // Mobile
      )}
    >
      <h3 className="font-semibold text-center text-lg mb-2">Selected Dates</h3>
      <ul className="space-y-2">
        {sortedDates.map((date) => {
          const isActive = activeDate?.getTime() === date.getTime();
          const desktopFormat: Intl.DateTimeFormatOptions = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          };
          return (
            <li
              key={date.toISOString()}
              ref={(node) => itemRefs.current.set(date.toISOString(), node)}
              onClick={() => onActiveDateChange(date)}
              className={cn(
                "p-2 rounded-md cursor-pointer border-2",
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-accent"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                {isMobile ? (
                  <>
                    <span className="flex-grow font-small text-sm">
                      {date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })}
                    </span>
                    <Input
                      id={`time-${date.toISOString()}`}
                      type="time"
                      className="w-28 h-8"
                      value={`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
                      onChange={(e) => handleTimeChange(date, e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Prevent re-selecting the date
                    />
                  </>
                ) : (
                  <div className="flex-grow">
                    <p className="font-small">
                      {date.toLocaleDateString(undefined, desktopFormat)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <label htmlFor={`time-${date.toISOString()}`} className="text-sm">Time:</label>
                      <Input
                        id={`time-${date.toISOString()}`}
                        type="time"
                        className="w-32 h-8"
                        value={`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
                        onChange={(e) => handleTimeChange(date, e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent re-selecting the date
                      />
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(date);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
