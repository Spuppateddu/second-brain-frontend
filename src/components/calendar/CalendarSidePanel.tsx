"use client";

import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { HiArrowsPointingOut, HiCake, HiCalendarDays } from "react-icons/hi2";

import type { CalendarDay } from "@/types/calendar";

function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function dayLabel(date: string): string {
  const d = parseLocalDate(date);
  const wk = d
    .toLocaleDateString("en-US", { weekday: "short" })
    .slice(0, 2)
    .toUpperCase();
  const mo = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${wk} ${d.getDate()} ${mo}`;
}

function monthLabel(monthKey: string): string {
  return parseLocalDate(`${monthKey}-01`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function completionPct(day: CalendarDay): number {
  if (day.total_notes === 0) return 0;
  return Math.round((day.done_notes / day.total_notes) * 100);
}

function getContrastColor(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#ffffff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1f2937" : "#ffffff";
}

type DroppableDayRowProps = {
  day: CalendarDay;
  selected: boolean;
  splitOpen: boolean;
  isDragHovering: boolean;
  onSelect: () => void;
  onOpenInSplit?: () => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
};

function DayRow({
  day,
  selected,
  splitOpen,
  isDragHovering,
  onSelect,
  onOpenInSplit,
  onDragOver,
  onDragLeave,
  onDrop,
}: DroppableDayRowProps) {
  const isToday = day.date === todayString();
  const dow = parseLocalDate(day.date).getDay();
  const isWeekend = dow === 0 || dow === 6;
  const total = day.total_notes;
  const pct = completionPct(day);
  const hasBirthday = day.birthday_pending_notes > 0;
  const hasEvent = day.event_pending_notes > 0;

  return (
    <div
      data-day-date={day.date}
      onClick={onSelect}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        "group m-1 p-1.5 rounded-md shadow cursor-pointer flex flex-col gap-1",
        isWeekend
          ? "bg-orange-50 border-l-4 border-orange-300 dark:bg-orange-900/20 dark:border-orange-500"
          : "bg-white dark:bg-gray-700",
        selected ? "ring-2 ring-primary-500" : "",
        isDragHovering ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20" : "",
      ].join(" ")}
      style={
        isWeekend
          ? {
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(251, 146, 60, 0.15) 8px, rgba(251, 146, 60, 0.15) 16px)",
            }
          : undefined
      }
    >
      <div className="flex items-center gap-1 w-full">
        {isToday && (
          <span
            className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0"
            aria-label="Today"
          />
        )}
        {total > 0 ? (
          <div className="relative flex-1">
            <div className="h-6 w-full bg-gray-300 rounded-lg overflow-hidden dark:bg-gray-600">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="absolute inset-y-0 left-2 flex items-center text-sm font-semibold text-white pointer-events-none">
              {dayLabel(day.date)}
            </p>
          </div>
        ) : (
          <span className="text-xs leading-tight flex-1">
            {dayLabel(day.date)}
          </span>
        )}
        {onOpenInSplit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!splitOpen) onOpenInSplit();
            }}
            disabled={splitOpen}
            className={[
              "flex-shrink-0 p-0.5 rounded transition-opacity",
              splitOpen
                ? "opacity-100 text-green-500 dark:text-green-400 cursor-not-allowed"
                : "opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-500 dark:text-blue-400",
            ].join(" ")}
            title={
              splitOpen ? "Already open in split view" : "Open in split view"
            }
          >
            <HiArrowsPointingOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {(() => {
        const untagged = day.personal_pending_notes + day.auto_pending_notes;
        if (
          day.category_counts.length === 0 &&
          untagged === 0 &&
          !hasBirthday &&
          !hasEvent
        )
          return null;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {day.category_counts.slice(0, 4).map((c) => (
              <span
                key={c.category_id}
                className="inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium"
                style={{
                  backgroundColor: c.category_color,
                  color: getContrastColor(c.category_color),
                }}
              >
                {c.count}
              </span>
            ))}
            {untagged > 0 && (
              <span
                title="Tasks without a tag"
                className="inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
              >
                {untagged}
              </span>
            )}
            {hasBirthday && (
              <HiCake
                className="h-4 w-4 flex-shrink-0 text-pink-500"
                title="Birthday"
              />
            )}
            {hasEvent && (
              <HiCalendarDays
                className="h-4 w-4 flex-shrink-0 text-amber-500"
                title="Event"
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}

export type CalendarSidePanelProps = {
  days: CalendarDay[];
  selectedDate: string;
  splitOpenDates?: string[];
  dragOverDate: string | null;
  onSelectDate: (d: string) => void;
  onOpenInSplit?: (date: string) => void;
  onDragOverDate?: (date: string) => void;
  onDragLeaveDate?: () => void;
  onDropOnDate?: (date: string) => void;
};

export function CalendarSidePanel({
  days,
  selectedDate,
  splitOpenDates = [],
  dragOverDate,
  onSelectDate,
  onOpenInSplit,
  onDragOverDate,
  onDragLeaveDate,
  onDropOnDate,
}: CalendarSidePanelProps) {
  const [pickerDirection, setPickerDirection] = useState<"prev" | "next" | null>(
    null,
  );

  // Group days by month for readability.
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarDay[]>();
    for (const day of days) {
      const key = day.date.slice(0, 7);
      const list = map.get(key) ?? [];
      list.push(day);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [days]);

  return (
    <div className="flex flex-col p-1 min-h-full">
      <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-primary-50 dark:bg-gray-800">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onPress={() => setPickerDirection("prev")}
        >
          Go to previous date
        </Button>
      </div>

      {grouped.map(([monthKey, monthDays]) => (
        <section key={monthKey} className="flex flex-col">
          <h3 className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {monthLabel(monthKey)}
          </h3>
          {monthDays.map((day) => (
            <DayRow
              key={day.date}
              day={day}
              selected={day.date === selectedDate}
              splitOpen={splitOpenDates.includes(day.date)}
              isDragHovering={dragOverDate === day.date}
              onSelect={() => onSelectDate(day.date)}
              onOpenInSplit={
                onOpenInSplit ? () => onOpenInSplit(day.date) : undefined
              }
              onDragOver={
                onDragOverDate
                  ? (e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      onDragOverDate(day.date);
                    }
                  : undefined
              }
              onDragLeave={onDragLeaveDate}
              onDrop={
                onDropOnDate
                  ? (e) => {
                      e.preventDefault();
                      onDropOnDate(day.date);
                    }
                  : undefined
              }
            />
          ))}
        </section>
      ))}

      <div className="sticky bottom-0 z-10 mt-auto -mx-1 px-1 py-1 bg-primary-50 dark:bg-gray-800">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onPress={() => setPickerDirection("next")}
        >
          Go to next date
        </Button>
      </div>

      {pickerDirection !== null && (
        <DatePickerModal
          direction={pickerDirection}
          initialDate={selectedDate}
          onCancel={() => setPickerDirection(null)}
          onConfirm={(date) => {
            setPickerDirection(null);
            onSelectDate(date);
          }}
        />
      )}
    </div>
  );
}

function todayLocalString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

type DatePickerModalProps = {
  direction: "prev" | "next";
  initialDate: string;
  onCancel: () => void;
  onConfirm: (date: string) => void;
};

function DatePickerModal({
  direction,
  initialDate,
  onCancel,
  onConfirm,
}: DatePickerModalProps) {
  const [value, setValue] = useState(initialDate);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = todayLocalString();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const title =
    direction === "prev" ? "Select previous date" : "Select next date";
  const max = direction === "prev" ? today : undefined;
  const min = direction === "next" ? today : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    onConfirm(value);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-date-picker-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h3
            id="calendar-date-picker-title"
            className="text-base font-semibold"
          >
            {title}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="calendar-date-picker"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
            >
              Date
            </label>
            <input
              id="calendar-date-picker"
              ref={inputRef}
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={min}
              max={max}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onPress={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isDisabled={!/^\d{4}-\d{2}-\d{2}$/.test(value)}
            >
              Go to this date
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
