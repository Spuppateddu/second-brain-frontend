"use client";

import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import {
  HiArrowPath,
  HiBeaker,
  HiCheck,
  HiClock,
  HiXMark,
} from "react-icons/hi2";

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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pill-reminder-title"
    >
      <div className="w-full sm:max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40 sm:h-16 sm:w-16">
              <HiBeaker className="h-7 w-7 text-purple-600 dark:text-purple-300 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="pill-reminder-title"
                className="text-lg font-bold text-zinc-900 dark:text-zinc-100 sm:text-xl"
              >
                Time to take your pill!
              </h3>
              <p className="truncate text-base text-zinc-700 dark:text-zinc-300 sm:text-lg">
                {current.name}
              </p>
              <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                <HiClock className="h-4 w-4" />
                <span>Scheduled for {formatTime(current.taking_time)}</span>
              </div>
            </div>
          </div>

          {current.description ? (
            <p className="mb-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {current.description}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => markAsTaken(current.id)}
              className="flex-1 justify-center"
            >
              <HiCheck className="mr-2 h-5 w-5" />
              Mark as Taken
            </Button>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => snoozeReminder(current.id, 5)}
                className="flex-1 justify-center sm:flex-initial"
              >
                <HiArrowPath className="mr-1 h-5 w-5" />
                5 min
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => dismissReminder(current.id)}
                className="flex-1 justify-center sm:flex-initial"
              >
                <HiXMark className="mr-1 h-5 w-5" />
                Dismiss
              </Button>
            </div>
          </div>

          {extra > 0 ? (
            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              +{extra} more pill{extra > 1 ? "s" : ""} to take
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
