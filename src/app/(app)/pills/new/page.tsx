"use client";

import { Button, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import { useCreatePill } from "@/lib/queries/entities";

export default function NewPillPage() {
  const router = useRouter();
  const create = useCreatePill();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleType, setScheduleType] = useState<"daily" | "daily_interval">(
    "daily",
  );
  const [intervalDays, setIntervalDays] = useState("2");
  const [takingTime, setTakingTime] = useState("09:00");
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length > 0 &&
    /^\d{2}:\d{2}$/.test(takingTime) &&
    (scheduleType !== "daily_interval" || Number(intervalDays) >= 1);

  async function save() {
    setError(null);
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        schedule_type: scheduleType,
        interval_days:
          scheduleType === "daily_interval" ? Number(intervalDays) : null,
        taking_time: takingTime,
        is_active: true,
      });
      router.push("/pills");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(message);
    }
  }

  return (
    <EntityListShell title="New pill">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) void save();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Name <span className="text-danger">*</span>
          </span>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Description
          </span>
          <textarea
            className="min-h-[80px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Schedule
            </span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={scheduleType}
              onChange={(e) =>
                setScheduleType(e.target.value as "daily" | "daily_interval")
              }
            >
              <option value="daily">Daily</option>
              <option value="daily_interval">Every N days</option>
            </select>
          </label>
          {scheduleType === "daily_interval" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                Interval (days) <span className="text-danger">*</span>
              </span>
              <Input
                type="number"
                min={1}
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Taking time <span className="text-danger">*</span>
            </span>
            <Input
              type="time"
              value={takingTime}
              onChange={(e) => setTakingTime(e.target.value)}
            />
          </label>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/pills")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={!valid || create.isPending}
          >
            {create.isPending ? "Saving…" : "Create"}
          </Button>
        </div>
      </form>
    </EntityListShell>
  );
}
