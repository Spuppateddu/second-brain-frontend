"use client";

import { useMemo, useState } from "react";
import {
  HiCalendar,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiPlus,
  HiQueueList,
  HiStar,
} from "react-icons/hi2";

import { TaskModal } from "@/components/calendar/TaskModal";
import { ClosePlanningPeriodDialog } from "@/components/planning/ClosePlanningPeriodDialog";
import { usePlanning } from "@/lib/queries/heavy";
import type { PlanningPeriod, PlanningTaskLite } from "@/types/heavy";

type StatusFilter = "all" | "incomplete" | "completed";
type PeriodMode = "month" | "year";

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftYear(year: string, delta: number): string {
  return String(Number(year) + delta);
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
}

function originLabel(task: PlanningTaskLite): string | null {
  if (!task.origin_year) return null;
  if (task.origin_month) {
    const d = new Date(task.origin_year, task.origin_month - 1, 1);
    const carriedForward = d.toLocaleString("en", {
      month: "long",
      year: "numeric",
    });
    return `From ${carriedForward}`;
  }
  return `From ${task.origin_year}`;
}

function formatCalendarTaskDates(
  linked: { task_date?: string }[],
): string | null {
  const dates = linked
    .map((t) => t.task_date)
    .filter((d): d is string => !!d)
    .sort();
  if (dates.length === 0) return null;
  return dates
    .map((d) => {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day).toLocaleString("en", {
        month: "short",
        day: "numeric",
      });
    })
    .join(", ");
}

function getContrastColor(hex: string): string {
  const m = (hex || "#cccccc").replace("#", "");
  if (m.length !== 6) return "#ffffff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1f2937" : "#ffffff";
}

function StarRow({ stars, max = 5 }: { stars: number; max?: number }) {
  return (
    <span className="inline-flex items-center" aria-label={`${stars} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <HiStar
          key={i}
          className={[
            "h-3.5 w-3.5",
            i < stars ? "text-yellow-400" : "text-zinc-300 dark:text-zinc-600",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className="h-full bg-blue-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatusFilterToggle({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const items: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "incomplete", label: "Not completed" },
    { key: "completed", label: "Completed" },
  ];
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      {items.map(({ key, label }, i) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={[
              "px-3 py-1.5 text-sm transition-colors",
              i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : "",
              active
                ? "bg-blue-500 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  onOpen,
}: {
  task: PlanningTaskLite;
  onOpen: (t: PlanningTaskLite) => void;
}) {
  const isWork = !!task.is_work;
  const isDone = !!task.is_done;
  const isCancelled = !!task.is_cancelled;
  const stars = task.stars ?? 0;
  const carry = originLabel(task);
  const linkedCalendarTasks =
    task.linkedCalendarTasks ?? task.linked_calendar_tasks ?? [];
  const categories = task.taskCategories ?? task.task_categories ?? [];

  const borderColor = isWork ? "border-l-orange-400" : "border-l-cyan-400";
  const bgColor = isWork
    ? "bg-orange-50/40 dark:bg-orange-500/5"
    : "bg-white dark:bg-zinc-900";

  const titleStyle = isCancelled
    ? "line-through text-zinc-400"
    : isDone
      ? "text-zinc-400 dark:text-zinc-500"
      : "text-zinc-800 dark:text-zinc-100";

  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className={[
        "group flex w-full items-start gap-3 rounded-md border border-zinc-200 border-l-4 p-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60",
        borderColor,
        bgColor,
      ].join(" ")}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <StarRow stars={stars} />
          <span className={["text-sm", titleStyle].join(" ")}>
            {task.content}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {carry && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {carry}
            </span>
          )}
          {linkedCalendarTasks.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <HiCalendar className="h-3 w-3" />
              {formatCalendarTaskDates(linkedCalendarTasks) ??
                linkedCalendarTasks.length}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {categories.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: c.color,
              color: getContrastColor(c.color),
            }}
          >
            {c.name}
          </span>
        ))}
      </div>
    </button>
  );
}

function StarGroup({
  stars,
  tasks,
  onOpen,
}: {
  stars: number;
  tasks: PlanningTaskLite[];
  onOpen: (t: PlanningTaskLite) => void;
}) {
  const [open, setOpen] = useState(stars >= 4);
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60"
      >
        <span className="flex items-center gap-2">
          {stars > 0 ? (
            <StarRow stars={stars} />
          ) : (
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Unrated
            </span>
          )}
          <span className="text-xs text-zinc-500">({tasks.length})</span>
        </span>
        <HiChevronDown
          className={[
            "h-4 w-4 text-zinc-500 transition-transform",
            open ? "" : "-rotate-90",
          ].join(" ")}
        />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function PeriodCard({
  period,
  label,
  mode,
  onPrev,
  onNext,
  navTitle,
}: {
  period: PlanningPeriod | null;
  label: string;
  mode: PeriodMode;
  navTitle: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("incomplete");
  const [taskSectionOpen, setTaskSectionOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState<PlanningTaskLite | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const tasks = useMemo<PlanningTaskLite[]>(
    () =>
      ((period?.tasks ?? []) as PlanningTaskLite[]).slice().sort((a, b) => {
        const sa = a.stars ?? 0;
        const sb = b.stars ?? 0;
        if (sa !== sb) return sb - sa;
        return a.order - b.order;
      }),
    [period],
  );

  const visibleTasks = useMemo(() => {
    if (statusFilter === "completed") return tasks.filter((t) => t.is_done);
    if (statusFilter === "incomplete") return tasks.filter((t) => !t.is_done);
    return tasks;
  }, [tasks, statusFilter]);

  const groups = useMemo(() => {
    const buckets = new Map<number, PlanningTaskLite[]>();
    for (const t of visibleTasks) {
      const key = t.stars ?? 0;
      const list = buckets.get(key);
      if (list) list.push(t);
      else buckets.set(key, [t]);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => b - a);
  }, [visibleTasks]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.is_done).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  function openCreate() {
    setModalTask(null);
    setModalOpen(true);
  }
  function openEdit(t: PlanningTaskLite) {
    setModalTask(t);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalTask(null);
  }

  const closeButtonLabel = mode === "month" ? "Close Month" : "Close Year";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {label}
          </span>
          <button
            type="button"
            onClick={onPrev}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Previous"
          >
            <HiChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[7rem] text-center text-sm text-zinc-700 dark:text-zinc-300">
            {navTitle}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Next"
          >
            <HiChevronRight className="h-4 w-4" />
          </button>
          <StatusFilterToggle value={statusFilter} onChange={setStatusFilter} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            disabled={!period}
            title="Add task"
            className="rounded-md bg-blue-700 p-2 text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <HiPlus className="h-5 w-5" />
          </button>
          {period?.can_be_closed && (
            <button
              type="button"
              onClick={() => setCloseDialogOpen(true)}
              className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
            >
              {closeButtonLabel}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={progress} />
      </div>

      {!period ? (
        <p className="mt-4 text-sm text-zinc-500">No planning for this period.</p>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setTaskSectionOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            <HiQueueList className="h-4 w-4 text-zinc-500" />
            Task
            <HiChevronDown
              className={[
                "h-4 w-4 text-zinc-500 transition-transform",
                taskSectionOpen ? "" : "-rotate-90",
              ].join(" ")}
            />
          </button>

          {taskSectionOpen && (
            <div className="mt-3 flex flex-col gap-2">
              {groups.length === 0 ? (
                <p className="text-sm text-zinc-500">No tasks yet.</p>
              ) : (
                groups.map(([stars, list]) => (
                  <StarGroup
                    key={stars}
                    stars={stars}
                    tasks={list}
                    onOpen={openEdit}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={closeModal}
        mode="planning"
        planningTask={modalTask}
        planningPeriod={
          period
            ? {
                start_date: period.start_date,
                end_date: period.end_date,
                planning_type_id: period.planning_type_id,
              }
            : undefined
        }
      />

      {period && (
        <ClosePlanningPeriodDialog
          open={closeDialogOpen}
          onClose={() => setCloseDialogOpen(false)}
          period={period}
          mode={mode}
        />
      )}
    </div>
  );
}

export default function PlanningPage() {
  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const initialYear = String(today.getFullYear());

  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const { data, isLoading, error } = usePlanning({ month, year });

  const period = periodMode === "month" ? data?.monthlyPlanning : data?.yearlyPlanning;
  const navTitle = periodMode === "month" ? monthLabel(month) : year;
  const cardLabel = periodMode === "month" ? "Monthly Planning" : "Yearly Planning";

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Planning Dashboard</h1>
        <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          {(
            [
              { key: "month", label: "Monthly" },
              { key: "year", label: "Yearly" },
            ] as const
          ).map(({ key, label }, i) => {
            const active = periodMode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPeriodMode(key)}
                className={[
                  "px-3 py-1.5 text-sm transition-colors",
                  i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : "",
                  active
                    ? "bg-blue-500 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the planning. Try refreshing.
        </p>
      ) : (
        <PeriodCard
          period={period ?? null}
          label={cardLabel}
          mode={periodMode}
          navTitle={navTitle}
          onPrev={() =>
            periodMode === "month"
              ? setMonth((m) => shiftMonth(m, -1))
              : setYear((y) => shiftYear(y, -1))
          }
          onNext={() =>
            periodMode === "month"
              ? setMonth((m) => shiftMonth(m, 1))
              : setYear((y) => shiftYear(y, 1))
          }
        />
      )}
    </div>
  );
}
