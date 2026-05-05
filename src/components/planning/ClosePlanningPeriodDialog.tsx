"use client";

import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { heavyKeys } from "@/lib/queries/heavy";
import type { PlanningPeriod } from "@/types/heavy";

type Props = {
  open: boolean;
  onClose: () => void;
  period: PlanningPeriod;
  mode: "month" | "year";
};

function nextMonth(periodStartDate: string): string {
  const [y, m] = periodStartDate.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextYear(periodStartDate: string): string {
  return String(Number(periodStartDate.slice(0, 4)) + 1);
}

export function ClosePlanningPeriodDialog({
  open,
  onClose,
  period,
  mode,
}: Props) {
  const queryClient = useQueryClient();
  const defaultDestination = useMemo(
    () =>
      mode === "month"
        ? nextMonth(period.start_date)
        : nextYear(period.start_date),
    [mode, period.start_date],
  );
  const [destination, setDestination] = useState(defaultDestination);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDestination(defaultDestination);
      setError(null);
    }
  }, [open, defaultDestination]);

  const incompleteCount = useMemo(
    () =>
      (period.tasks ?? []).filter((t) => !t.is_done && !t.is_cancelled).length,
    [period.tasks],
  );

  async function submit() {
    if (!destination) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/planning-periods/close-to-month", {
        start_date: period.start_date,
        end_date: period.end_date,
        planning_type_id: period.planning_type_id,
        destination_month: destination,
      });
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
      onClose();
    } catch {
      setError("Failed to close period. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const title = mode === "month" ? "Close Month" : "Close Year";
  const destLabel =
    mode === "month"
      ? "Move incomplete tasks to month"
      : "Move incomplete tasks to year";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {incompleteCount === 0
            ? "No incomplete tasks to carry forward. Closing will mark this period as closed."
            : `${incompleteCount} incomplete ${incompleteCount === 1 ? "task" : "tasks"} will be blocked here and copied forward. Completed and cancelled tasks stay put.`}
        </p>

        <div className="mt-4 flex flex-col gap-1">
          <label
            className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
            htmlFor="close-destination"
          >
            {destLabel}
          </label>
          {mode === "month" ? (
            <input
              id="close-destination"
              type="month"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/40 dark:border-zinc-800 dark:bg-zinc-950"
            />
          ) : (
            <input
              id="close-destination"
              type="number"
              min={1900}
              max={2100}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/40 dark:border-zinc-800 dark:bg-zinc-950"
            />
          )}
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            isDisabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={submit}
            isDisabled={submitting || !destination}
          >
            {submitting ? "Closing…" : "Close & carry forward"}
          </Button>
        </div>
      </div>
    </div>
  );
}
