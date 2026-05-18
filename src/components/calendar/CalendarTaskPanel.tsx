"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  HiArrowRightCircle,
  HiBars3,
  HiBeaker,
  HiBriefcase,
  HiCake,
  HiCalendar,
  HiCalendarDays,
  HiCheck,
  HiCheckCircle,
  HiClock,
  HiLink,
  HiNoSymbol,
  HiPlus,
  HiQueueList,
  HiSparkles,
  HiUser,
  HiUsers,
  HiViewColumns,
  HiXMark,
} from "react-icons/hi2";

import { TaskModal } from "@/components/calendar/TaskModal";
import { WaterTracker } from "@/components/calendar/WaterTracker";
import { Button } from "@/components/UI/Button";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { useCalendarDay, useMoveCalendarTask } from "@/lib/queries/calendar";
import {
  useDismissPill,
  useMarkPillTaken,
  usePillsForDate,
  type PillForDate,
} from "@/lib/queries/entities";
import type { CalendarTask } from "@/types/calendar";

type StatusFilter = "all" | "not_completed" | "completed" | "cancelled";
type TypeFilter = "all" | "work" | "personal";

function fullDateLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function parseTimeToMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(":").map((s) => Number(s) || 0);
  return h * 60 + m;
}

function formatGap(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function isAutoTask(t: CalendarTask) {
  return !!t.auto_task_rule_id;
}
function isEventTask(t: CalendarTask) {
  return !!t.event_task_id;
}
function isBirthdayTask(t: CalendarTask) {
  // The new schema doesn't expose birthday_note_id directly; person_id on a
  // calendar task corresponds to the auto-generated birthday task.
  return !!t.person_id && !t.event_task_id && !t.auto_task_rule_id;
}
function isLinkedToPlanning(t: CalendarTask): boolean {
  return (
    !!t.linkedPlanningTask ||
    !!t.linkedPlanningSubTask ||
    !!t.linked_planning_task_id ||
    !!t.linked_planning_sub_task_id
  );
}

// ── Pill card ───────────────────────────────────────────────────────────────

function PillCard({ pill, date }: { pill: PillForDate; date: string }) {
  const markTaken = useMarkPillTaken();
  const dismiss = useDismissPill();
  const taken = pill.today_log?.status === "taken";
  const dismissed = pill.today_log?.status === "dismissed";
  const pending = !taken && !dismissed;
  const busy = markTaken.isPending || dismiss.isPending;
  const titleStyle = dismissed
    ? "line-through text-secondary-400"
    : taken
      ? "text-secondary-400 dark:text-secondary-500"
      : "text-secondary-800 dark:text-secondary-100";

  return (
    <div className="group relative w-full text-left p-3 rounded-[var(--radius-card)] border-l-4 bg-purple-500/20 dark:bg-purple-500/10 border-l-purple-500">
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={["font-medium truncate", titleStyle].join(" ")}>
            {pill.name}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-secondary-500 dark:text-secondary-400">
            <HiClock className="w-3 h-3" />
            {pill.taking_time.slice(0, 5)}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <IconButton
            size="xs"
            variant={taken ? "success" : "ghost"}
            label={taken ? "Taken" : "Mark as taken"}
            disabled={busy || taken}
            loading={markTaken.isPending}
            onClick={() => markTaken.mutate({ id: pill.id, date })}
          >
            <HiCheck />
          </IconButton>
          <IconButton
            size="xs"
            variant={dismissed ? "danger" : "ghost"}
            label={dismissed ? "Dismissed" : "Dismiss"}
            disabled={busy || dismissed}
            loading={dismiss.isPending}
            onClick={() => dismiss.mutate({ id: pill.id, date })}
          >
            <HiNoSymbol />
          </IconButton>
          <HiBeaker
            className={[
              "w-4 h-4 text-purple-600 dark:text-purple-300",
              pending ? "" : "opacity-60",
            ].join(" ")}
          />
        </div>
      </div>
    </div>
  );
}

// ── Task card ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  date,
  selected,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  task: CalendarTask;
  date: string;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onDragStart?: (task: CalendarTask) => void;
  onDragEnd?: () => void;
  onOpen: (task: CalendarTask) => void;
}) {
  const isWork = task.is_work;
  const isDone = task.is_done;
  const isCancelled = task.is_cancelled;
  const auto = isAutoTask(task);
  const event = isEventTask(task);
  const birthday = isBirthdayTask(task);
  const linked = isLinkedToPlanning(task);

  let bg = "";
  if (isWork) {
    bg = "bg-orange-500/20 dark:bg-orange-500/10 border-l-orange-500";
  } else if (birthday) {
    bg = "bg-pink-500/20 dark:bg-pink-500/10 border-l-pink-500";
  } else if (event) {
    bg = "bg-amber-700/20 dark:bg-amber-800/10 border-l-amber-700";
  } else if (auto) {
    bg = "bg-violet-500/20 dark:bg-violet-600/10 border-l-violet-500";
  } else {
    bg = "bg-sky-300/20 dark:bg-sky-400/10 border-l-sky-400";
  }

  const titleStyle = isCancelled
    ? "line-through text-secondary-400"
    : isDone
      ? "text-secondary-400 dark:text-secondary-500"
      : "text-secondary-800 dark:text-secondary-100";

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/x-calendar-task",
      JSON.stringify({ id: task.id, fromDate: date }),
    );
    onDragStart?.(task);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      className={[
        "group relative w-full text-left p-3 rounded-[var(--radius-card)] border-l-4 hover:opacity-90 transition-opacity cursor-pointer",
        bg,
        selected ? "ring-2 ring-primary-500" : "",
      ].join(" ")}
    >
      <div className="relative flex items-start justify-between gap-2">
        <div
          className="flex-shrink-0 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(task.id)}
            aria-label={`Select task ${task.title || task.content || ""}`}
            className="h-4 w-4 rounded border-secondary-400 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={["font-medium truncate", titleStyle].join(" ")}>
            {task.title || task.content || ""}
          </p>
          {task.start_time && (
            <p className="mt-1 flex items-center gap-1 text-xs text-secondary-500 dark:text-secondary-400">
              <HiClock className="w-3 h-3" />
              {task.start_time}
              {task.end_time ? ` - ${task.end_time}` : ""}
            </p>
          )}
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 flex-shrink-0"
        >
          {isDone && (
            <span className="p-1 rounded-full bg-success-100 dark:bg-success-900/30">
              <HiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
            </span>
          )}
          {isCancelled && (
            <span className="p-1 rounded-full bg-danger-100 dark:bg-danger-900/30">
              <HiNoSymbol className="w-3 h-3 text-danger-600 dark:text-danger-400" />
            </span>
          )}
          {isWork ? (
            <HiBriefcase className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          ) : birthday ? (
            <HiCake className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          ) : event ? (
            <HiCalendar className="w-4 h-4 text-amber-800 dark:text-amber-400" />
          ) : auto ? (
            <HiSparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          ) : (
            <HiUser className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          )}
          {linked && (
            <HiLink className="w-4 h-4 text-info-600 dark:text-info-400" />
          )}
        </div>
      </div>
      {task.taskCategories && task.taskCategories.length > 0 && (
        <div className="relative mt-2 flex flex-wrap gap-1">
          {task.taskCategories.map((cat) => (
            <span
              key={cat.id}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Filter toolbar groups ──────────────────────────────────────────────────

function StatusFilterGroup({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const items: { key: StatusFilter; icon: typeof HiViewColumns; title: string; activeBg: string }[] = [
    { key: "all", icon: HiViewColumns, title: "All", activeBg: "bg-primary-600 text-white" },
    { key: "not_completed", icon: HiQueueList, title: "Not completed", activeBg: "bg-primary-600 text-white" },
    { key: "completed", icon: HiCheck, title: "Completed", activeBg: "bg-success-500 text-white" },
    { key: "cancelled", icon: HiNoSymbol, title: "Cancelled", activeBg: "bg-danger-500 text-white" },
  ];
  return (
    <div className="flex items-center rounded-[var(--radius-control)] border border-secondary-200 dark:border-secondary-700 overflow-hidden">
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
              i > 0 ? "border-l border-secondary-200 dark:border-secondary-700" : "",
              active
                ? activeBg
                : "bg-white dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700",
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

function TypeFilterGroup({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  const items: { key: TypeFilter; icon: typeof HiUsers; title: string; activeBg: string }[] = [
    { key: "all", icon: HiUsers, title: "All types", activeBg: "bg-primary-600 text-white" },
    { key: "work", icon: HiBriefcase, title: "Work", activeBg: "bg-orange-500 text-white" },
    { key: "personal", icon: HiUser, title: "Personal", activeBg: "bg-sky-500 text-white" },
  ];
  return (
    <div className="flex items-center rounded-[var(--radius-control)] border border-secondary-200 dark:border-secondary-700 overflow-hidden">
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
              i > 0 ? "border-l border-secondary-200 dark:border-secondary-700" : "",
              active
                ? activeBg
                : "bg-white dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700",
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

// ── Public TaskPanel ───────────────────────────────────────────────────────

export type CalendarTaskPanelProps = {
  date: string;
  onToggleMobileSide: () => void;
  onDragStartTask?: (task: CalendarTask) => void;
  onDragEndTask?: () => void;
};

export function CalendarTaskPanel({
  date,
  onToggleMobileSide,
  onDragStartTask,
  onDragEndTask,
}: CalendarTaskPanelProps) {
  const { data, isLoading, error } = useCalendarDay(date);
  const { data: pills } = usePillsForDate(date);
  const move = useMoveCalendarTask();
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("not_completed");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState<CalendarTask | null>(null);
  // Selection is scoped to the currently shown `date`. Tracking the date
  // alongside the ids lets us reset the set when the panel switches days
  // without using an effect (see React docs: "Storing information from
  // previous renders").
  const [selectionState, setSelectionState] = useState<{
    date: string;
    ids: Set<number>;
  }>({ date, ids: new Set() });
  const selectedIds =
    selectionState.date === date ? selectionState.ids : new Set<number>();
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movePending, setMovePending] = useState(false);
  // If the panel switched days, also close the move modal.
  if (selectionState.date !== date && moveModalOpen) {
    setMoveModalOpen(false);
  }

  function updateSelection(
    updater: (prev: Set<number>) => Set<number>,
  ) {
    setSelectionState((prev) => {
      const base = prev.date === date ? prev.ids : new Set<number>();
      return { date, ids: updater(base) };
    });
  }

  function toggleSelect(id: number) {
    updateSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    updateSelection(() => new Set());
  }

  function openCreate() {
    setModalTask(null);
    setModalOpen(true);
  }
  function openEdit(t: CalendarTask) {
    setModalTask(t);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalTask(null);
  }

  const allTasks = useMemo(
    () => [...(data?.calendarTasks ?? []), ...(data?.calendarWorkTasks ?? [])],
    [data],
  );

  const filtered = useMemo(() => {
    return allTasks.filter((t) => {
      if (statusFilter === "not_completed" && (t.is_done || t.is_cancelled))
        return false;
      if (statusFilter === "completed" && (!t.is_done || t.is_cancelled))
        return false;
      if (statusFilter === "cancelled" && !t.is_cancelled) return false;
      if (typeFilter === "work" && !t.is_work) return false;
      if (typeFilter === "personal" && t.is_work) return false;
      return true;
    });
  }, [allTasks, statusFilter, typeFilter]);

  const undoneIds = useMemo(
    () =>
      allTasks
        .filter((t) => !t.is_done && !t.is_cancelled)
        .map((t) => t.id),
    [allTasks],
  );
  const allUndoneSelected =
    undoneIds.length > 0 && undoneIds.every((id) => selectedIds.has(id));

  function toggleSelectAllUndone() {
    updateSelection((prev) => {
      const next = new Set(prev);
      if (allUndoneSelected) {
        undoneIds.forEach((id) => next.delete(id));
      } else {
        undoneIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function moveSelectedTo(targetDate: string) {
    if (selectedIds.size === 0 || targetDate === date) {
      setMoveModalOpen(false);
      return;
    }
    setMovePending(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          move.mutateAsync({ id, task_date: targetDate }),
        ),
      );
      updateSelection(() => new Set());
      setMoveModalOpen(false);
    } finally {
      setMovePending(false);
    }
  }

  type TimedItem =
    | { kind: "task"; time: string; endTime: string; task: CalendarTask }
    | { kind: "pill"; time: string; endTime: string; pill: PillForDate };

  const timedItems = useMemo<TimedItem[]>(() => {
    const taskItems: TimedItem[] = filtered
      .filter((t) => !!t.start_time)
      .map((t) => ({
        kind: "task",
        time: t.start_time ?? "",
        endTime: t.end_time ?? t.start_time ?? "",
        task: t,
      }));
    const pillItems: TimedItem[] =
      // Pill type filter respects the toolbar: hide under "work".
      typeFilter === "work"
        ? []
        : (pills ?? [])
            .filter((p) => {
              const status = p.today_log?.status;
              if (statusFilter === "not_completed" && status && status !== "pending")
                return false;
              if (statusFilter === "completed" && status !== "taken") return false;
              if (statusFilter === "cancelled" && status !== "dismissed") return false;
              return true;
            })
            .map((p) => ({
              kind: "pill",
              time: p.taking_time.slice(0, 5),
              endTime: p.taking_time.slice(0, 5),
              pill: p,
            }));
    return [...taskItems, ...pillItems].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
  }, [filtered, pills, statusFilter, typeFilter]);

  const withoutTime = useMemo(
    () =>
      filtered.filter((t) => !t.start_time).sort((a, b) => a.order - b.order),
    [filtered],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-secondary-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-secondary-200 dark:border-secondary-800 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <IconButton
              size="sm"
              variant="ghost"
              label="Toggle day list"
              onClick={onToggleMobileSide}
              className="sm:hidden"
            >
              <HiBars3 />
            </IconButton>
            <h2 className="text-sm sm:text-lg font-bold text-secondary-900 dark:text-secondary-100 capitalize truncate">
              {fullDateLabel(date)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <WaterTracker date={date} />
            <IconButton
              variant="primary"
              size="sm"
              label="Add task"
              onClick={openCreate}
            >
              <HiPlus />
            </IconButton>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusFilterGroup value={statusFilter} onChange={setStatusFilter} />
          <TypeFilterGroup value={typeFilter} onChange={setTypeFilter} />
          <IconButton
            size="sm"
            variant={allUndoneSelected ? "primary" : "ghost"}
            label={
              allUndoneSelected
                ? "Deselect all undone tasks"
                : "Select all undone tasks"
            }
            disabled={undoneIds.length === 0}
            onClick={toggleSelectAllUndone}
          >
            <HiCheckCircle />
          </IconButton>
          <IconButton
            size="sm"
            variant="primary"
            label={
              selectedIds.size === 0
                ? "Move selected tasks to another day"
                : `Move ${selectedIds.size} selected to another day`
            }
            disabled={selectedIds.size === 0}
            onClick={() => setMoveModalOpen(true)}
          >
            <HiArrowRightCircle />
          </IconButton>
          {selectedIds.size > 0 && (
            <>
              <span
                className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                aria-live="polite"
              >
                {selectedIds.size} selected
              </span>
              <IconButton
                size="sm"
                variant="ghost"
                label="Clear selection"
                onClick={clearSelection}
              >
                <HiXMark />
              </IconButton>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {isLoading ? (
          <div className="text-sm text-secondary-500 dark:text-secondary-400">
            Loading day…
          </div>
        ) : error || !data ? (
          <div className="text-sm text-danger-600 dark:text-danger-400">
            Couldn&rsquo;t load this day.
          </div>
        ) : filtered.length === 0 && timedItems.length === 0 ? (
          <div className="text-sm text-secondary-500 dark:text-secondary-400">
            No tasks match the filters.
          </div>
        ) : (
          <>
            {timedItems.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                  <HiClock className="w-3.5 h-3.5" />
                  With time ({timedItems.length})
                </h3>
                <div className="space-y-2">
                  {timedItems.map((item, idx) => {
                    const prev = idx > 0 ? timedItems[idx - 1] : null;
                    const gapLabel = prev
                      ? formatGap(
                          parseTimeToMinutes(item.time) -
                            parseTimeToMinutes(prev.endTime),
                        )
                      : "";
                    const key =
                      item.kind === "pill"
                        ? `pill-${item.pill.id}`
                        : `task-${item.task.id}`;
                    return (
                      <Fragment key={key}>
                        {gapLabel && (
                          <div className="flex items-center gap-1 pl-2 text-[10px] text-secondary-400 dark:text-secondary-500">
                            <HiClock className="w-3 h-3" />
                            {gapLabel}
                          </div>
                        )}
                        {item.kind === "pill" ? (
                          <PillCard pill={item.pill} date={date} />
                        ) : (
                          <TaskCard
                            task={item.task}
                            date={date}
                            selected={selectedIds.has(item.task.id)}
                            onToggleSelect={toggleSelect}
                            onDragStart={onDragStartTask}
                            onDragEnd={onDragEndTask}
                            onOpen={openEdit}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </section>
            )}
            {withoutTime.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                  Without time ({withoutTime.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {withoutTime.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      date={date}
                      selected={selectedIds.has(task.id)}
                      onToggleSelect={toggleSelect}
                      onDragStart={onDragStartTask}
                      onDragEnd={onDragEndTask}
                      onOpen={openEdit}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={closeModal}
        mode="calendar"
        task={modalTask}
        defaultDate={date}
        defaultIsWork={typeFilter === "work"}
      />

      {moveModalOpen && (
        <MoveTasksModal
          count={selectedIds.size}
          fromDate={date}
          pending={movePending}
          onCancel={() => setMoveModalOpen(false)}
          onConfirm={moveSelectedTo}
        />
      )}
    </div>
  );
}

type MoveTasksModalProps = {
  count: number;
  fromDate: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (date: string) => void;
};

function MoveTasksModal({
  count,
  fromDate,
  pending,
  onCancel,
  onConfirm,
}: MoveTasksModalProps) {
  const [value, setValue] = useState(fromDate);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        e.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, pending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value === fromDate) return;
    onConfirm(value);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-move-tasks-title"
      onClick={pending ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[var(--radius-card)] border border-secondary-200 bg-white shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-secondary-200 px-5 py-3 dark:border-secondary-800">
          <HiCalendarDays className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h3
            id="calendar-move-tasks-title"
            className="text-base font-semibold text-secondary-900 dark:text-secondary-100"
          >
            Move {count} task{count === 1 ? "" : "s"} to…
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Input
            ref={inputRef}
            id="calendar-move-tasks-date"
            label="Target date"
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            fullWidth
            disabled={pending}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={pending}
              disabled={
                pending ||
                !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
                value === fromDate
              }
            >
              Move tasks
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
