"use client";

import { Button } from "@heroui/react";
import { useState } from "react";

import { Input } from "@/components/UI/Input";
import type { EventTaskInput } from "@/lib/queries/entities";
import type { EventTask } from "@/types/entities";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function EventTaskForm({
  initial,
  mode,
  isPending,
  error,
  onCancel,
  onSubmit,
}: {
  initial?: EventTask;
  mode: "create" | "edit";
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: EventTaskInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [month, setMonth] = useState(initial?.month ?? 1);
  const [day, setDay] = useState(initial?.day ?? 1);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const valid = name.trim().length > 0 && day >= 1 && day <= 31;
  const submitLabel =
    mode === "create" ? "Create Event Task" : "Update Event Task";
  const pendingLabel = mode === "create" ? "Creating…" : "Updating…";
  const heading =
    mode === "create" ? "Create Event Task" : "Edit Event Task";
  const monthLabel = MONTHS[month - 1] ?? "";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-3 py-6 sm:px-6 sm:py-12">
      <h1 className="text-xl font-semibold sm:text-2xl">{heading}</h1>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <form
          className="space-y-6 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valid) return;
            await onSubmit({
              name: name.trim(),
              month,
              day,
              is_active: isActive,
            });
          }}
        >
          <div>
            <label
              htmlFor="event-name"
              className="mb-1 block text-sm font-medium"
            >
              Event Name
            </label>
            <Input
              id="event-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              The name of the recurring event or holiday
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="event-month"
                className="mb-1 block text-sm font-medium"
              >
                Month
              </label>
              <select
                id="event-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {MONTHS.map((label, i) => (
                  <option key={i + 1} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="event-day"
                className="mb-1 block text-sm font-medium"
              >
                Day
              </label>
              <select
                id="event-day"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-primary-600 shadow-sm focus:ring-primary-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <span>Active (will generate calendar tasks)</span>
            </label>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              When active, this event will automatically create calendar tasks
              each year
            </p>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-700/50 dark:bg-blue-900/20">
            <h3 className="mb-1 font-medium text-zinc-700 dark:text-zinc-200">
              Preview
            </h3>
            <p className="text-blue-700 dark:text-blue-300">
              <span className="font-medium">
                {name.trim() || "(unnamed event)"}
              </span>{" "}
              will occur every{" "}
              <span className="font-medium">
                {monthLabel} {day}
              </span>
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              All-day event — no specific time
            </p>
            <p>
              Status:{" "}
              {isActive ? (
                <span className="font-medium text-success-600 dark:text-success-400">
                  Active
                </span>
              ) : (
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Inactive
                </span>
              )}
            </p>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              isDisabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={!valid || isPending}
            >
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
