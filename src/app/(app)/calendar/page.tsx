"use client";

import { useEffect, useState } from "react";
import { HiXMark } from "react-icons/hi2";

import { CalendarBottomStrip } from "@/components/calendar/CalendarBottomStrip";
import { CalendarSidePanel } from "@/components/calendar/CalendarSidePanel";
import { CalendarTaskPanel } from "@/components/calendar/CalendarTaskPanel";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCalendarOverview,
  useMoveCalendarTask,
} from "@/lib/queries/calendar";
import type { CalendarTask } from "@/types/calendar";

const MAX_SPLIT_PANELS = 4;

function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function shortDateLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function CalendarPage() {
  const { data, isLoading, error } = useCalendarOverview();
  const auth = useAuth();
  const move = useMoveCalendarTask();

  const [selectedDate, setSelectedDate] = useState<string>(() => todayString());
  const [showMobileSide, setShowMobileSide] = useState(false);

  // Phase 5: split panels — additional days opened side-by-side with the main task panel.
  const [splitDates, setSplitDates] = useState<string[]>([]);

  // Phase 5: HTML5 DnD state
  const [draggingTask, setDraggingTask] = useState<CalendarTask | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Reset drag state when navigating away
  useEffect(() => {
    function onDragEnd() {
      setDraggingTask(null);
      setDragOverDate(null);
    }
    window.addEventListener("dragend", onDragEnd);
    return () => window.removeEventListener("dragend", onDragEnd);
  }, []);

  if (isLoading) {
    return <div className="p-6 text-sm text-zinc-500">Loading calendar…</div>;
  }
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-danger">
        Couldn&rsquo;t load the calendar. Try refreshing.
      </div>
    );
  }

  const days = data.calendarDays;
  // Use the user-picked date as-is so "Go to date" can jump to a day that's
  // outside the overview window. The task panel fetches its own data per date.
  const effectiveDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
    ? selectedDate
    : (days[0]?.date ?? todayString());

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setShowMobileSide(false);
  }

  function handleOpenInSplit(date: string) {
    setSplitDates((prev) => {
      if (prev.includes(date) || date === effectiveDate) return prev;
      if (prev.length >= MAX_SPLIT_PANELS - 1) return prev;
      return [...prev, date];
    });
  }

  function handleCloseSplit(date: string) {
    setSplitDates((prev) => prev.filter((d) => d !== date));
  }

  function handleDropOnDate(targetDate: string) {
    const task = draggingTask;
    setDraggingTask(null);
    setDragOverDate(null);
    if (!task) return;
    if (task.task_date === targetDate) return;
    move.mutate({ id: task.id, task_date: targetDate });
  }

  const splitOpenDates = [effectiveDate, ...splitDates];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop side panel */}
      <aside className="hidden sm:block w-60 h-full bg-primary-50 shadow-md border-r border-primary-200 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
        <CalendarSidePanel
          days={days}
          selectedDate={effectiveDate}
          splitOpenDates={splitOpenDates}
          dragOverDate={dragOverDate}
          onSelectDate={handleSelectDate}
          onOpenInSplit={handleOpenInSplit}
          onDragOverDate={(d) => setDragOverDate(d)}
          onDragLeaveDate={() => setDragOverDate(null)}
          onDropOnDate={handleDropOnDate}
        />
      </aside>

      {/* Mobile side panel */}
      <aside
        className={[
          "sm:hidden w-full h-full bg-primary-50 shadow-md overflow-y-auto dark:bg-gray-800",
          showMobileSide ? "block" : "hidden",
        ].join(" ")}
      >
        <CalendarSidePanel
          days={days}
          selectedDate={effectiveDate}
          splitOpenDates={splitOpenDates}
          dragOverDate={dragOverDate}
          onSelectDate={handleSelectDate}
          onDragOverDate={(d) => setDragOverDate(d)}
          onDragLeaveDate={() => setDragOverDate(null)}
          onDropOnDate={handleDropOnDate}
        />
      </aside>

      {/* Task panel(s) + bottom strip */}
      <div
        className={[
          "flex-1 min-w-0 bg-secondary-50 dark:bg-gray-900 overflow-hidden flex-col",
          showMobileSide ? "hidden sm:flex" : "flex",
        ].join(" ")}
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex h-full min-h-0">
            <div className="flex-1 min-w-0 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0">
              <CalendarTaskPanel
                date={effectiveDate}
                onToggleMobileSide={() => setShowMobileSide((s) => !s)}
                onDragStartTask={setDraggingTask}
                onDragEndTask={() => {
                  setDraggingTask(null);
                  setDragOverDate(null);
                }}
              />
            </div>
            {splitDates.map((date) => (
              <div
                key={date}
                className="flex-1 min-w-0 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 relative"
              >
                <button
                  type="button"
                  onClick={() => handleCloseSplit(date)}
                  title={`Close ${shortDateLabel(date)}`}
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1 text-zinc-600 shadow hover:bg-white dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <HiXMark className="h-4 w-4" />
                </button>
                <CalendarTaskPanel
                  date={date}
                  onToggleMobileSide={() => setShowMobileSide((s) => !s)}
                  onDragStartTask={setDraggingTask}
                  onDragEndTask={() => {
                    setDraggingTask(null);
                    setDragOverDate(null);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <CalendarBottomStrip
          privileges={auth.privileges}
          selectedDate={effectiveDate}
        />
      </div>

      {/* Floating drag preview pinned near the cursor isn't natural with HTML5 DnD;
          showing a small status banner instead so the user gets feedback. */}
      {draggingTask && (
        <div
          className={[
            "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 text-sm shadow-lg pointer-events-none",
            draggingTask.is_work
              ? "bg-orange-500 text-white"
              : "bg-sky-500 text-white",
          ].join(" ")}
        >
          Moving “{draggingTask.title}” — drop on a day in the side panel
        </div>
      )}
    </div>
  );
}
