"use client";

import { useState } from "react";
import { HiCheck } from "react-icons/hi2";

import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
import { Textarea } from "@/components/UI/Textarea";
import type { PillFull, PillInput } from "@/lib/queries/entities";

const REMINDER_INTERVAL_OPTIONS = [
  { value: 30, label: "Every 30 seconds" },
  { value: 60, label: "Every 1 minute" },
  { value: 120, label: "Every 2 minutes" },
  { value: 300, label: "Every 5 minutes" },
  { value: 600, label: "Every 10 minutes" },
];

const SHOW_BEFORE_OPTIONS = [
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
];

export function PillForm({
  initial,
  submitLabel,
  isPending,
  error,
  onSubmit,
  extraActions,
}: {
  initial?: PillFull;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (input: PillInput) => Promise<void>;
  extraActions?: React.ReactNode;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [scheduleType, setScheduleType] = useState<
    "daily" | "daily_interval"
  >(initial?.schedule_type ?? "daily");
  const [intervalDays, setIntervalDays] = useState<string>(
    String(initial?.interval_days ?? 2),
  );
  const [takingTime, setTakingTime] = useState(
    initial?.taking_time?.slice(0, 5) ?? "08:00",
  );
  const [reminderInterval, setReminderInterval] = useState<number>(
    initial?.reminder_interval_seconds ?? 60,
  );
  const [showBefore, setShowBefore] = useState<number>(
    initial?.show_before_minutes ?? 60,
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");

  const valid =
    name.trim().length > 0 &&
    /^\d{2}:\d{2}$/.test(takingTime) &&
    (scheduleType !== "daily_interval" || Number(intervalDays) >= 1);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const payload: PillInput = {
          name: name.trim(),
          description: description.trim() || null,
          schedule_type: scheduleType,
          interval_days:
            scheduleType === "daily_interval" ? Number(intervalDays) : null,
          taking_time: takingTime,
          reminder_interval_seconds: reminderInterval,
          show_before_minutes: showBefore,
          is_active: isActive,
          start_date: startDate || null,
          end_date: endDate || null,
        };
        await onSubmit(payload);
      }}
    >
      <FormSection
        title="Basics"
        description="The pill or supplement this rule represents."
      >
        <Input
          label="Name *"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Vitamin D"
          autoFocus
          fullWidth
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes"
          rows={3}
          fullWidth
        />
      </FormSection>

      <FormSection
        title="Schedule"
        description="When the pill should be taken."
      >
        <Select
          label="Type"
          value={scheduleType}
          onChange={(e) =>
            setScheduleType(e.target.value as "daily" | "daily_interval")
          }
          fullWidth
        >
          <option value="daily">Every day</option>
          <option value="daily_interval">Every N days</option>
        </Select>

        {scheduleType === "daily_interval" ? (
          <Input
            label="Every N days *"
            type="number"
            min={1}
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            fullWidth
          />
        ) : null}

        <Input
          label="Taking time *"
          type="time"
          value={takingTime}
          onChange={(e) => setTakingTime(e.target.value)}
          fullWidth
        />
      </FormSection>

      <FormSection
        title="Reminders"
        description="How often to nudge you and how far ahead to surface in the calendar."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Reminder interval"
            value={reminderInterval}
            onChange={(e) => setReminderInterval(Number(e.target.value))}
            fullWidth
          >
            {REMINDER_INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Show in calendar"
            value={showBefore}
            onChange={(e) => setShowBefore(Number(e.target.value))}
            fullWidth
          >
            {SHOW_BEFORE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </FormSection>

      <FormSection
        title="Advanced"
        description="Date range and active state. Leave dates empty for a permanent rule."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
          />
          <Input
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
          />
        </div>
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
