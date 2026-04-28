"use client";

import { useMemo, useState, type DragEvent } from "react";
import {
  HiBars3,
  HiBriefcase,
  HiCake,
  HiCalendar,
  HiCheck,
  HiClock,
  HiLink,
  HiNoSymbol,
  HiPlus,
  HiQueueList,
  HiSparkles,
  HiUser,
  HiUsers,
  HiViewColumns,
} from "react-icons/hi2";

import { TaskModal } from "@/components/calendar/TaskModal";
import { WaterTracker } from "@/components/calendar/WaterTracker";
import { useCalendarDay } from "@/lib/queries/calendar";
import type { CalendarTask } from "@/types/calendar";

type StatusFilter = "all" | "not_completed" | "cancelled";
type TypeFilter = "all" | "work" | "personal";

function fullDateLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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

// ── Task card ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  date,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  task: CalendarTask;
  date: string;
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
    ? "line-through text-gray-400"
    : isDone
      ? "text-gray-400 dark:text-gray-500"
      : "text-gray-800 dark:text-gray-100";

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
        "group relative w-full text-left p-3 rounded-lg border-l-4 hover:opacity-90 transition-opacity cursor-pointer",
        bg,
      ].join(" ")}
    >
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={["font-medium truncate", titleStyle].join(" ")}>
            {task.title || task.content || ""}
          </p>
          {task.start_time && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
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
            <span className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
              <HiCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
            </span>
          )}
          {isCancelled && (
            <span className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
              <HiNoSymbol className="w-3 h-3 text-red-600 dark:text-red-400" />
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
            <HiLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
    { key: "all", icon: HiViewColumns, title: "All", activeBg: "bg-blue-500 text-white" },
    { key: "not_completed", icon: HiQueueList, title: "Not completed", activeBg: "bg-blue-500 text-white" },
    { key: "cancelled", icon: HiNoSymbol, title: "Cancelled", activeBg: "bg-red-500 text-white" },
  ];
  return (
    <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      {items.map(({ key, icon: Icon, title, activeBg }, i) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            title={title}
            onClick={() => onChange(key)}
            className={[
              "p-1.5 transition-colors",
              i > 0 ? "border-l border-gray-200 dark:border-gray-600" : "",
              active
                ? activeBg
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600",
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
    { key: "all", icon: HiUsers, title: "All types", activeBg: "bg-blue-500 text-white" },
    { key: "work", icon: HiBriefcase, title: "Work", activeBg: "bg-orange-500 text-white" },
    { key: "personal", icon: HiUser, title: "Personal", activeBg: "bg-sky-500 text-white" },
  ];
  return (
    <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      {items.map(({ key, icon: Icon, title, activeBg }, i) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            title={title}
            onClick={() => onChange(key)}
            className={[
              "p-1.5 transition-colors",
              i > 0 ? "border-l border-gray-200 dark:border-gray-600" : "",
              active
                ? activeBg
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600",
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
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("not_completed");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState<CalendarTask | null>(null);

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
      if (statusFilter === "cancelled" && !t.is_cancelled) return false;
      if (typeFilter === "work" && !t.is_work) return false;
      if (typeFilter === "personal" && t.is_work) return false;
      return true;
    });
  }, [allTasks, statusFilter, typeFilter]);

  const withTime = useMemo(
    () =>
      filtered
        .filter((t) => !!t.start_time)
        .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? "")),
    [filtered],
  );

  const withoutTime = useMemo(
    () =>
      filtered.filter((t) => !t.start_time).sort((a, b) => a.order - b.order),
    [filtered],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onToggleMobileSide}
              className="sm:hidden rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle day list"
            >
              <HiBars3 className="h-5 w-5" />
            </button>
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100 capitalize truncate">
              {fullDateLabel(date)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <WaterTracker date={date} />
            <button
              type="button"
              onClick={openCreate}
              title="Add task"
              className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-md active:scale-95 transition-all"
            >
              <HiPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusFilterGroup value={statusFilter} onChange={setStatusFilter} />
          <TypeFilterGroup value={typeFilter} onChange={setTypeFilter} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {isLoading ? (
          <div className="text-sm text-zinc-500">Loading day…</div>
        ) : error || !data ? (
          <div className="text-sm text-danger">
            Couldn&rsquo;t load this day.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-zinc-500">No tasks match the filters.</div>
        ) : (
          <>
            {withTime.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <HiClock className="w-3.5 h-3.5" />
                  With time ({withTime.length})
                </h3>
                <div className="space-y-2">
                  {withTime.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      date={date}
                      onDragStart={onDragStartTask}
                      onDragEnd={onDragEndTask}
                      onOpen={openEdit}
                    />
                  ))}
                </div>
              </section>
            )}
            {withoutTime.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Without time ({withoutTime.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {withoutTime.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      date={date}
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
    </div>
  );
}
