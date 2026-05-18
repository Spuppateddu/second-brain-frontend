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
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { IconButton } from "@/components/UI/IconButton";
import { usePlanning } from "@/lib/queries/heavy";
import { describeDueDate, type DueStatus } from "@/lib/utils/dueDate";
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

function DueBadge({ due }: { due: DueStatus }) {
  const tone: Record<DueStatus["tone"], string> = {
    overdue:
      "bg-danger-50 text-danger-700 ring-danger-200 dark:bg-danger-900/30 dark:text-danger-300 dark:ring-danger-800",
    today:
      "bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-900/30 dark:text-warning-300 dark:ring-warning-800",
    soon:
      "bg-info-50 text-info-700 ring-info-200 dark:bg-info-900/30 dark:text-info-300 dark:ring-info-800",
    upcoming:
      "bg-secondary-100 text-secondary-700 ring-secondary-200 dark:bg-secondary-800 dark:text-secondary-200 dark:ring-secondary-700",
  };
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        tone[due.tone],
      ].join(" ")}
      title={due.diffLabel}
    >
      <HiCalendar className="h-3 w-3" />
      <span>{due.dateLabel}</span>
      <span className="opacity-70">·</span>
      <span>{due.diffLabel}</span>
    </span>
  );
}

function StarRow({ stars, max = 5 }: { stars: number; max?: number }) {
  return (
    <span className="inline-flex items-center" aria-label={`${stars} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <HiStar
          key={i}
          className={[
            "h-3.5 w-3.5",
            i < stars
              ? "text-yellow-400"
              : "text-secondary-300 dark:text-secondary-600",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
      <div
        className="h-full bg-success-500 transition-all"
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
      activeBg: "bg-primary-600 text-white",
    },
    {
      key: "incomplete",
      icon: HiQueueList,
      title: "Not completed",
      activeBg: "bg-primary-600 text-white",
    },
    {
      key: "completed",
      icon: HiCheck,
      title: "Completed",
      activeBg: "bg-success-500 text-white",
    },
  ];
  return (
    <div className="flex items-center overflow-hidden rounded-[var(--radius-control)] border border-secondary-200 dark:border-secondary-700">
      {items.map(({ key, icon: Icon, title, activeBg }, i) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={[
              "p-1.5 transition-colors",
              i > 0
                ? "border-l border-secondary-200 dark:border-secondary-700"
                : "",
              active
                ? activeBg
                : "bg-white text-secondary-500 hover:bg-secondary-100 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:bg-secondary-700",
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
  const due = describeDueDate(task.task_date);

  const borderColor = isBlocked
    ? "border-l-secondary-400"
    : isWork
      ? "border-l-orange-400"
      : "border-l-cyan-400";
  const bgColor = isBlocked
    ? "bg-secondary-100/70 dark:bg-secondary-900/40"
    : isWork
      ? "bg-orange-50/40 dark:bg-orange-500/5"
      : "bg-white dark:bg-secondary-900";

  const titleStyle = isCancelled
    ? "line-through text-secondary-400"
    : isBlocked
      ? "italic text-secondary-400 dark:text-secondary-500"
      : isDone
        ? "line-through text-secondary-400 dark:text-secondary-500"
        : "text-secondary-800 dark:text-secondary-100";

  const interactive = !isBlocked;

  return (
    <button
      type="button"
      onClick={() => interactive && onOpen(task)}
      disabled={!interactive}
      aria-disabled={!interactive}
      title={isBlocked ? "Closed — carried forward to another period" : undefined}
      className={[
        "group flex w-full items-start gap-3 rounded-[var(--radius-control)] border border-secondary-200 border-l-4 px-3 py-1.5 text-left transition-colors dark:border-secondary-800",
        interactive
          ? "hover:bg-secondary-50 dark:hover:bg-secondary-900/60"
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
            <Badge variant="neutral">
              <HiLockClosed className="mr-1 h-3 w-3" />
              Closed
            </Badge>
          )}
          {!isBlocked && isDone && (
            <Badge variant="success">
              <HiCheck className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          )}
          {!isBlocked && !isDone && isCancelled && (
            <Badge variant="danger">
              <HiNoSymbol className="mr-1 h-3 w-3" />
              Cancelled
            </Badge>
          )}
          {carry && <Badge variant="info">{carry}</Badge>}
          {linkedCalendarTasks.length > 0 && (
            <Badge variant="info">
              <HiCalendar className="mr-1 h-3 w-3" />
              {formatCalendarTaskDates(linkedCalendarTasks) ??
                linkedCalendarTasks.length}
            </Badge>
          )}
          {due && !isDone && !isCancelled && !isBlocked && (
            <DueBadge due={due} />
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
    <div className="rounded-[var(--radius-card)] border border-secondary-200 dark:border-secondary-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-card)] bg-secondary-50 px-3 py-2 text-sm dark:bg-secondary-900/60"
      >
        <span className="flex items-center gap-2">
          {stars > 0 ? (
            <StarRow stars={stars} />
          ) : (
            <span className="text-xs uppercase tracking-wide text-secondary-500">
              Unrated
            </span>
          )}
          <span className="text-xs text-secondary-500">({tasks.length})</span>
        </span>
        <HiChevronDown
          className={[
            "h-4 w-4 text-secondary-500 transition-transform",
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
        // Within the same star bucket, tasks with the nearest due date come
        // first; tasks without a due date go to the bottom.
        const da = a.task_date ?? null;
        const db = b.task_date ?? null;
        if (da && db && da !== db) return da < db ? -1 : 1;
        if (da && !db) return -1;
        if (!da && db) return 1;
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
    <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white px-4 py-3 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950 sm:px-6 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
            {label}
          </span>
          <IconButton
            size="xs"
            variant="ghost"
            label="Previous"
            onClick={onPrev}
          >
            <HiChevronLeft />
          </IconButton>
          <span className="min-w-[7rem] text-center text-sm text-secondary-700 dark:text-secondary-300">
            {navTitle}
          </span>
          <IconButton
            size="xs"
            variant="ghost"
            label="Next"
            onClick={onNext}
          >
            <HiChevronRight />
          </IconButton>
          <StatusFilterToggle value={statusFilter} onChange={setStatusFilter} />
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            variant="primary"
            size="sm"
            label="Add task"
            onClick={openCreate}
            disabled={!period}
          >
            <HiPlus />
          </IconButton>
          {period?.can_be_closed && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCloseDialogOpen(true)}
            >
              {closeButtonLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={progress} />
      </div>

      {!period ? (
        <p className="mt-4 text-sm text-secondary-500 dark:text-secondary-400">
          No planning for this period.
        </p>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setTaskSectionOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-secondary-700 dark:text-secondary-200"
          >
            <HiQueueList className="h-4 w-4 text-secondary-500" />
            Task
            <HiChevronDown
              className={[
                "h-4 w-4 text-secondary-500 transition-transform",
                taskSectionOpen ? "" : "-rotate-90",
              ].join(" ")}
            />
          </button>

          {taskSectionOpen && (
            <div className="mt-3 flex flex-col gap-2">
              {groups.length === 0 ? (
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  No tasks yet.
                </p>
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Planning Dashboard
          </h1>
        </header>

        {isLoading ? (
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            Loading…
          </p>
        ) : error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
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
    </div>
  );
}
