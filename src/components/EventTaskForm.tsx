"use client";

import { useState } from "react";
import { HiCheck } from "react-icons/hi2";

import { Badge } from "@/components/UI/Badge";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
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
  submitLabel,
  isPending,
  error,
  onSubmit,
  extraActions,
}: {
  initial?: EventTask;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (input: EventTaskInput) => Promise<void>;
  extraActions?: React.ReactNode;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [month, setMonth] = useState(initial?.month ?? 1);
  const [day, setDay] = useState(initial?.day ?? 1);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const valid = name.trim().length > 0 && day >= 1 && day <= 31;
  const monthLabel = MONTHS[month - 1] ?? "";

  return (
    <form
      className="flex flex-col gap-4"
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
      <FormSection
        title="Basics"
        description="The recurring event or holiday this rule represents."
      >
        <Input
          label="Event name *"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          fullWidth
        />
      </FormSection>

      <FormSection
        title="Date"
        description="The day of the year this event repeats on."
      >
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            fullWidth
          >
            {MONTHS.map((label, i) => (
              <option key={i + 1} value={i + 1}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Day"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            fullWidth
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </FormSection>

      <FormSection
        title="Status"
        description="Active rules generate a calendar task each year."
      >
        <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500/30 dark:border-secondary-700 dark:bg-secondary-950"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Active</span>
        </label>
      </FormSection>

      <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-800 dark:bg-secondary-900">
        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
          Preview
        </p>
        <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-300">
          <span className="font-medium">
            {name.trim() || "(unnamed event)"}
          </span>{" "}
          will occur every{" "}
          <span className="font-medium text-primary-600 dark:text-primary-400">
            {monthLabel} {day}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
          All-day event — no specific time.
        </p>
        <div className="mt-2">
          <Badge variant={isActive ? "success" : "neutral"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {extraActions}
        <IconButton
          type="submit"
          variant="primary"
          size="md"
          loading={isPending}
          disabled={!valid || isPending}
          label={submitLabel}
        >
          <HiCheck />
        </IconButton>
      </div>
    </form>
  );
}
