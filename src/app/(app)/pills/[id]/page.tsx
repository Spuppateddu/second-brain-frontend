"use client";

import { Button, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import {
  useDeletePill,
  usePill,
  useUpdatePill,
} from "@/lib/queries/entities";
import type { PillFull } from "@/lib/queries/entities";

function PillEditForm({ pill }: { pill: PillFull }) {
  const router = useRouter();
  const update = useUpdatePill(pill.id);
  const remove = useDeletePill();

  const [name, setName] = useState(pill.name);
  const [description, setDescription] = useState(pill.description ?? "");
  const [scheduleType, setScheduleType] = useState<"daily" | "daily_interval">(
    (pill.schedule_type as "daily" | "daily_interval") ?? "daily",
  );
  const [intervalDays, setIntervalDays] = useState(
    String(pill.interval_days ?? 2),
  );
  const [takingTime, setTakingTime] = useState(pill.taking_time ?? "09:00");
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length > 0 &&
    /^\d{2}:\d{2}$/.test(takingTime) &&
    (scheduleType !== "daily_interval" || Number(intervalDays) >= 1);

  async function save() {
    setError(null);
    try {
      await update.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        schedule_type: scheduleType,
        interval_days:
          scheduleType === "daily_interval" ? Number(intervalDays) : null,
        taking_time: takingTime,
        is_active: pill.is_active,
      });
      router.push("/pills");
    } catch (err) {
      const m =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(m);
    }
  }

  async function destroy() {
    if (!confirm("Delete this pill?")) return;
    try {
      await remove.mutateAsync(pill.id);
      router.push("/pills");
    } catch {
      setError("Failed to delete.");
    }
  }

  return (
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
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="danger-soft"
          size="sm"
          isDisabled={remove.isPending}
          onClick={destroy}
        >
          Delete
        </Button>
        <div className="flex items-center gap-2">
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
            isDisabled={!valid || update.isPending}
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function EditPillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pillId = Number(id);
  const { data, isLoading, error } = usePill(
    Number.isNaN(pillId) ? null : pillId,
  );

  if (Number.isNaN(pillId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid pill id.</p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Pill · ${data.name}` : "Pill"}
      isLoading={isLoading}
      error={error}
    >
      {data ? <PillEditForm pill={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
