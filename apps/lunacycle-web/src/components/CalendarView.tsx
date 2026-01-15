import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { useLoadable } from "atom.io/react";
import './calendar.css';
import { calendarEntriesSelector } from "@/atoms";

export function CalendarView() {
  const calendarEntries = useLoadable(calendarEntriesSelector, []);
  if (calendarEntries.error) return null;
  if (calendarEntries.loading) return null;


  const handleSelect = (selectInfo: DateSelectArg) => {
    // Example: create an event on selection
    const title = prompt('Event title?');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect();

    if (title) {
      calendarApi.addEvent({
        title,
        start: selectInfo.start,
        end: selectInfo.end,
        allDay: selectInfo.allDay,
      });
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`Delete "${clickInfo.event.title}"?`)) {
      clickInfo.event.remove();
    }
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      selectable
      selectMirror
      select={handleSelect}
      eventClick={handleEventClick}
      events={calendarEntries.value}
      nowIndicator
      height="auto"
    />
  );
}
/*
import { useLoadable } from "atom.io/react";
import { categoryIdsAtom, focusedTaskIdsAtom } from "@/atoms";
import CategorySection from "@/components/CategorySection";
import { LoadIndicator } from "@/components/LoadIndicator";
import TaskCard from "@/components/TaskCard";
import { Separator } from "@/components/ui/separator";

export function TaskView() {
  const focusedTaskIds = useLoadable(focusedTaskIdsAtom, []);
  const categoryIds = useLoadable(categoryIdsAtom, []);

  return (
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
        {categoryIds.value
          .sort()
          .map((categoryId) => (
            <div key={categoryId} id={categoryId}>
              <CategorySection categoryId={categoryId} isTemplate={false} />
            </div>
          ))}
      </div>
    </>
  );
}

*/