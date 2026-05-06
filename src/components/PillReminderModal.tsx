"use client";

import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { HiArrowPath, HiBeaker, HiCheck, HiXMark } from "react-icons/hi2";

import { usePillsReminder } from "@/contexts/PillsReminderContext";

function formatTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const hour = parseInt(hStr, 10);
  if (Number.isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${mStr} ${ampm}`;
}

function isTimeToTakePill(takingTime: string): boolean {
  const [h, m] = takingTime.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const due = new Date();
  due.setHours(h, m, 0, 0);
  return Date.now() >= due.getTime();
}

export function PillReminderModal() {
  const { pendingReminders, markAsTaken, dismissReminder, snoozeReminder } =
    usePillsReminder();

  // Tick every 30s so we re-evaluate whether the next pill is now due.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const due = pendingReminders.filter((p) => isTimeToTakePill(p.taking_time));
  if (due.length === 0) return null;

  const current = due[0];
  const extra = due.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pill-reminder-title"
    >
      <div className="w-full overflow-hidden rounded-t-2xl border-t border-zinc-200 bg-white shadow-xl pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-md sm:rounded-2xl sm:border">
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-9 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="flex items-center gap-3 px-4 pt-3 sm:px-6 sm:pt-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40 sm:h-11 sm:w-11">
            <HiBeaker className="h-5 w-5 text-purple-600 dark:text-purple-300 sm:h-6 sm:w-6" />
          </div>
          <h3
            id="pill-reminder-title"
            className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base"
          >
            Time to take your pill
          </h3>
          {extra > 0 ? (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              +{extra} more
            </span>
          ) : null}
        </div>

        <div className="px-4 pt-3 sm:px-6">
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {current.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            Scheduled for {formatTime(current.taking_time)}
          </p>
          {current.description ? (
            <p className="mt-3 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 sm:text-sm">
              {current.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-5">
          <Button
            variant="primary"
            size="md"
            onClick={() => markAsTaken(current.id)}
            className="w-full justify-center"
          >
            <HiCheck className="mr-2 h-5 w-5" />
            Mark as Taken
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => snoozeReminder(current.id, 5)}
              className="justify-center"
            >
              <HiArrowPath className="mr-1.5 h-4 w-4" />
              Snooze 5m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dismissReminder(current.id)}
              className="justify-center text-danger"
            >
              <HiXMark className="mr-1.5 h-4 w-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
