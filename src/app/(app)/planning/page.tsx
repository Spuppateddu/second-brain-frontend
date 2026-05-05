"use client";

import { useMemo, useState } from "react";
import {
  HiCalendar,
  HiCheck,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiLockClosed,
  HiNoSymbol,
  HiPlus,
  HiQueueList,
  HiStar,
  HiViewColumns,
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
        className="h-full bg-green-500 transition-all"
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
  const items: {
    key: StatusFilter;
    icon: typeof HiViewColumns;
    title: string;
    activeBg: string;
  }[] = [
    {
      key: "all",
      icon: HiViewColumns,
      title: "All",
      activeBg: "bg-blue-500 text-white",
    },
    {
      key: "incomplete",
      icon: HiQueueList,
      title: "Not completed",
      activeBg: "bg-blue-500 text-white",
    },
    {
      key: "completed",
      icon: HiCheck,
      title: "Completed",
      activeBg: "bg-green-500 text-white",
    },
  ];
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      {items.map(({ key, icon: Icon, title, activeBg }, i) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            title={title}
            aria-label={title}
            onClick={() => onChange(key)}
            className={[
              "p-1.5 transition-colors",
              i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : "",
              active
                ? activeBg
                : "bg-white text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
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
  const isBlocked = !!task.is_blocked;
  const stars = task.stars ?? 0;
  const carry = originLabel(task);
  const linkedCalendarTasks =
    task.linkedCalendarTasks ?? task.linked_calendar_tasks ?? [];
  const categories = task.taskCategories ?? task.task_categories ?? [];

  const borderColor = isBlocked
    ? "border-l-zinc-400"
    : isWork
      ? "border-l-orange-400"
      : "border-l-cyan-400";
  const bgColor = isBlocked
    ? "bg-zinc-100/70 dark:bg-zinc-900/40"
    : isWork
      ? "bg-orange-50/40 dark:bg-orange-500/5"
      : "bg-white dark:bg-zinc-900";

  const titleStyle = isCancelled
    ? "line-through text-zinc-400"
    : isBlocked
      ? "italic text-zinc-400 dark:text-zinc-500"
      : isDone
        ? "line-through text-zinc-400 dark:text-zinc-500"
        : "text-zinc-800 dark:text-zinc-100";

  const interactive = !isBlocked;

  return (
    <button
      type="button"
      onClick={() => interactive && onOpen(task)}
      disabled={!interactive}
      aria-disabled={!interactive}
      title={isBlocked ? "Closed — carried forward to another period" : undefined}
      className={[
        "group flex w-full items-start gap-3 rounded-md border border-zinc-200 border-l-4 px-3 py-1.5 text-left transition-colors dark:border-zinc-800",
        interactive
          ? "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
          : "cursor-not-allowed",
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
          {isBlocked && (
            <span className="inline-flex items-center gap-1 rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
              <HiLockClosed className="h-3 w-3" />
              Closed
            </span>
          )}
          {!isBlocked && isDone && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <HiCheck className="h-3 w-3" />
              Completed
            </span>
          )}
          {!isBlocked && !isDone && isCancelled && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              <HiNoSymbol className="h-3 w-3" />
              Cancelled
            </span>
          )}
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
  defaultOpen,
}: {
  stars: number;
  tasks: PlanningTaskLite[];
  onOpen: (t: PlanningTaskLite) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
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
        <div className="flex flex-wrap gap-2 p-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex min-w-full sm:min-w-[calc(50%-0.25rem)] flex-1"
            >
              <TaskRow task={t} onOpen={onOpen} />
            </div>
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

  const defaultOpenStars = useMemo(() => {
    const open = new Set<number>([5, 4, 3]);
    const counts = new Map<number, number>();
    for (const [s, list] of groups) counts.set(s, list.length);
    let total = 0;
    for (const s of open) total += counts.get(s) ?? 0;
    for (const s of [2, 1, 0]) {
      if (total >= 10) break;
      open.add(s);
      total += counts.get(s) ?? 0;
    }
    return open;
  }, [groups]);

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
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6 sm:py-4">
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
                    key={`${period?.start_date ?? "p"}-${stars}`}
                    stars={stars}
                    tasks={list}
                    onOpen={openEdit}
                    defaultOpen={defaultOpenStars.has(stars)}
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

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const { data, isLoading, error } = usePlanning({ month, year });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Planning Dashboard</h1>
      </header>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the planning. Try refreshing.
        </p>
      ) : (
        <>
          <PeriodCard
            period={data?.monthlyPlanning ?? null}
            label="Monthly Planning"
            mode="month"
            navTitle={monthLabel(month)}
            onPrev={() => setMonth((m) => shiftMonth(m, -1))}
            onNext={() => setMonth((m) => shiftMonth(m, 1))}
          />
          <PeriodCard
            period={data?.yearlyPlanning ?? null}
            label="Yearly Planning"
            mode="year"
            navTitle={year}
            onPrev={() => setYear((y) => shiftYear(y, -1))}
            onNext={() => setYear((y) => shiftYear(y, 1))}
          />
        </>
      )}
    </div>
  );
}
