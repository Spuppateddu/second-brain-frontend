"use client";

import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiBriefcase,
  HiCalendarDays,
  HiCheck,
  HiLink,
  HiLockClosed,
  HiMagnifyingGlass,
  HiNoSymbol,
  HiPlus,
  HiStar,
  HiTrash,
  HiUser,
  HiXMark,
} from "react-icons/hi2";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import {
  calendarKeys,
  useCalendarDay,
  useCreateCalendarSubTask,
  useDeleteCalendarSubTask,
  useDeleteCalendarTask,
  useSkipAndDeleteCalendarTask,
  useUpdateCalendarSubTask,
  type LinkedEntityRef,
} from "@/lib/queries/calendar";
import {
  heavyKeys,
  useCopyPlanningToCalendar,
  useCreateOutOfPlanSubNote,
  useCreatePlanningSubTask,
  useDeleteOutOfPlanNote,
  useDeleteOutOfPlanSubNote,
  useDeletePlanningSubTask,
  useDeletePlanningTask,
  useUpdateOutOfPlanSubNote,
  useUpdatePlanningSubTask,
  useUpdatePlanningTask,
} from "@/lib/queries/heavy";
import {
  useSecondBrainSearch,
  useTaskCategories,
} from "@/lib/queries/entities";
import type {
  CalendarSubTask,
  CalendarTask,
  TaskCategory,
} from "@/types/calendar";
import type {
  OutOfPlanNote,
  OutOfPlanSubNote,
  PlanningSubTaskLite,
  PlanningTaskLite,
} from "@/types/heavy";

export type TaskModalMode = "calendar" | "planning" | "outofplan";

export type PlanningPeriodInput = {
  start_date: string;
  end_date: string;
  planning_type_id: number;
};

export type TaskModalProps = {
  open: boolean;
  onClose: () => void;
  /** Mode determines which API endpoints the modal targets. */
  mode: TaskModalMode;
  /** Existing calendar task to edit. */
  task?: CalendarTask | null;
  /** Default date (YYYY-MM-DD) when creating a calendar task. */
  defaultDate?: string;
  /** Default work/personal flag when creating. */
  defaultIsWork?: boolean;
  /** Existing planning task to edit. */
  planningTask?: PlanningTaskLite | null;
  /** Period the planning task belongs to (required when mode is "planning"). */
  planningPeriod?: PlanningPeriodInput;
  /** Existing out-of-plan note to edit. */
  outOfPlanNote?: OutOfPlanNote | null;
};

// Maps a search-result/entity-link `type` to the PHP model class string the
// backend's `linked_entities` API expects.
const TYPE_TO_MODEL_CLASS: Record<string, string> = {
  bookmark: "App\\Models\\Bookmark",
  note: "App\\Models\\Note",
  recipe: "App\\Models\\Recipe",
  wishlist_item: "App\\Models\\WishlistItem",
  place: "App\\Models\\Place",
  person: "App\\Models\\Person",
  bag: "App\\Models\\Bag",
  hardware: "App\\Models\\Hardware",
  software: "App\\Models\\Software",
  mega_file: "App\\Models\\MegaFile",
  trip: "App\\Models\\Trip",
};

const TYPE_LABEL: Record<string, string> = {
  bookmark: "Bookmark",
  note: "Note",
  recipe: "Recipe",
  wishlist_item: "Wishlist",
  place: "Place",
  person: "Person",
  bag: "Bag",
  hardware: "Hardware",
  software: "Software",
  mega_file: "Mega File",
  trip: "Trip",
};

type LinkChip = { type: string; id: number; label: string };

function shortDateLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getContrastColor(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#ffffff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1f2937" : "#ffffff";
}

type WithLinks = {
  linkedBookmarks?: { id: number; title?: string; name?: string }[];
  linkedNotes?: { id: number; title?: string; name?: string }[];
  linkedPersons?: { id: number; title?: string; name?: string }[];
  linkedPlaces?: { id: number; title?: string; name?: string }[];
  linkedRecipes?: { id: number; title?: string; name?: string }[];
  linkedWishlistItems?: { id: number; title?: string; name?: string }[];
  linkedBags?: { id: number; title?: string; name?: string }[];
  linkedHardware?: { id: number; title?: string; name?: string }[];
  linkedSoftware?: { id: number; title?: string; name?: string }[];
  linkedTrips?: { id: number; title?: string; name?: string }[];
};

function getInitialLinkChips(task: WithLinks | null | undefined): LinkChip[] {
  if (!task) return [];
  const out: LinkChip[] = [];
  const push = (type: string, list?: { id: number; title?: string; name?: string }[]) => {
    if (!list) return;
    for (const item of list) {
      out.push({ type, id: item.id, label: item.title ?? item.name ?? `#${item.id}` });
    }
  };
  push("bookmark", task.linkedBookmarks);
  push("note", task.linkedNotes);
  push("person", task.linkedPersons);
  push("place", task.linkedPlaces);
  push("recipe", task.linkedRecipes);
  push("wishlist_item", task.linkedWishlistItems);
  push("bag", task.linkedBags);
  push("hardware", task.linkedHardware);
  push("software", task.linkedSoftware);
  push("trip", task.linkedTrips);
  return out;
}

export function TaskModal(props: TaskModalProps) {
  if (!props.open) return null;
  let editKey: string;
  if (props.mode === "planning") {
    editKey = props.planningTask
      ? `plan-edit-${props.planningTask.id}`
      : `plan-new-${props.planningPeriod?.start_date ?? ""}`;
  } else if (props.mode === "outofplan") {
    editKey = props.outOfPlanNote ? `oop-edit-${props.outOfPlanNote.id}` : "oop-new";
  } else {
    editKey = props.task ? `edit-${props.task.id}` : `new-${props.defaultDate}`;
  }
  return <TaskModalForm key={editKey} {...props} />;
}

function TaskModalForm({
  onClose,
  mode,
  task,
  defaultDate,
  defaultIsWork = false,
  planningTask,
  planningPeriod,
  outOfPlanNote,
}: TaskModalProps) {
  const queryClient = useQueryClient();
  const isPlanning = mode === "planning";
  const isOutOfPlan = mode === "outofplan";
  const usesStars = isPlanning || isOutOfPlan;
  const editing = isPlanning
    ? !!planningTask
    : isOutOfPlan
      ? !!outOfPlanNote
      : !!task;
  const date = task?.task_date ?? defaultDate ?? "";

  const removeCalendar = useDeleteCalendarTask(date);
  const skipAndRemoveCalendar = useSkipAndDeleteCalendarTask(date);
  const removePlanning = useDeletePlanningTask();
  const removeOutOfPlan = useDeleteOutOfPlanNote();
  const updatePlanningTaskMut = useUpdatePlanningTask();
  const updatePlanningSubTaskMut = useUpdatePlanningSubTask();
  const dayQuery = useCalendarDay(date);

  const linkedPlanning = task?.linkedPlanningTask ?? null;
  const linkedPlanningSub = task?.linkedPlanningSubTask ?? null;
  const isCalendarLinkedToPlanning = !!(linkedPlanning || linkedPlanningSub);

  const pendingSubtasksCount = useMemo(() => {
    if (mode !== "calendar" || !task || !dayQuery.data) return 0;
    const live =
      dayQuery.data.calendarTasks.find((t) => t.id === task.id) ??
      dayQuery.data.calendarWorkTasks.find((t) => t.id === task.id) ??
      null;
    const subs = live?.subTasks ?? task.subTasks ?? [];
    return subs.filter((s) => !s.is_done).length;
  }, [mode, task, dayQuery.data]);
  const hasPendingSubtasks = pendingSubtasksCount > 0;

  const initialCategories = useMemo(
    () =>
      isPlanning
        ? (planningTask?.taskCategories ?? planningTask?.task_categories ?? [])
        : isOutOfPlan
          ? (outOfPlanNote?.taskCategories ?? outOfPlanNote?.task_categories ?? [])
          : (task?.taskCategories ?? []),
    [isPlanning, isOutOfPlan, planningTask, outOfPlanNote, task],
  );

  // Form state
  const [title, setTitle] = useState(
    isPlanning
      ? (planningTask?.content ?? "")
      : isOutOfPlan
        ? (outOfPlanNote?.content ?? "")
        : (task?.title || task?.content || ""),
  );
  const [description, setDescription] = useState(
    isPlanning
      ? (planningTask?.description ?? "")
      : isOutOfPlan
        ? (outOfPlanNote?.description ?? "")
        : (task?.description ?? ""),
  );
  const [isWork, setIsWork] = useState(
    isPlanning
      ? (planningTask?.is_work ?? defaultIsWork)
      : isOutOfPlan
        ? (outOfPlanNote?.is_work ?? defaultIsWork)
        : (task?.is_work ?? defaultIsWork),
  );
  const [isDone, setIsDone] = useState(
    isPlanning
      ? (planningTask?.is_done ?? false)
      : isOutOfPlan
        ? (outOfPlanNote?.is_done ?? false)
        : (task?.is_done ?? false),
  );
  const [isCancelled, setIsCancelled] = useState(
    isPlanning
      ? (planningTask?.is_cancelled ?? false)
      : isOutOfPlan
        ? (outOfPlanNote?.is_cancelled ?? false)
        : (task?.is_cancelled ?? false),
  );
  const isBlocked = isPlanning ? !!planningTask?.is_blocked : false;
  const formLocked = isDone || isBlocked;
  const [stars, setStars] = useState<number | null>(
    isPlanning
      ? (planningTask?.stars ?? null)
      : isOutOfPlan
        ? (outOfPlanNote?.stars ?? null)
        : null,
  );
  const [taskDate, setTaskDate] = useState(date);
  const [startTime, setStartTime] = useState(task?.start_time ?? "");
  const [endTime, setEndTime] = useState(task?.end_time ?? "");
  const [categoryIds, setCategoryIds] = useState<number[]>(
    initialCategories.map((c) => c.id),
  );
  const [linkChips, setLinkChips] = useState<LinkChip[]>(() =>
    getInitialLinkChips(
      isPlanning ? planningTask : isOutOfPlan ? outOfPlanNote : task,
    ),
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const categoryPickerRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkConfirm, setLinkConfirm] = useState<
    null | { kind: "task" | "subtask"; content: string }
  >(null);

  // Esc closes the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Click outside category picker closes it.
  useEffect(() => {
    if (!showCategoryPicker) return;
    const onDoc = (e: MouseEvent) => {
      if (
        categoryPickerRef.current &&
        !categoryPickerRef.current.contains(e.target as Node)
      ) {
        setShowCategoryPicker(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showCategoryPicker]);

  // Categories
  const allCategoriesQuery = useTaskCategories();
  const allCategories = useMemo(
    () => allCategoriesQuery.data ?? [],
    [allCategoriesQuery.data],
  );

  const selectedCategories: TaskCategory[] = useMemo(() => {
    const map = new Map<number, TaskCategory>();
    for (const c of initialCategories) map.set(c.id, c);
    for (const c of allCategories) map.set(c.id, c);
    return categoryIds
      .map((id) => map.get(id))
      .filter((c): c is TaskCategory => !!c);
  }, [initialCategories, allCategories, categoryIds]);

  function toggleCategory(c: TaskCategory) {
    setCategoryIds((prev) =>
      prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
    );
  }

  function buildLinkedEntitiesPayload(): LinkedEntityRef[] {
    return linkChips
      .map((c) => ({
        id: c.id,
        type: c.type,
        model_class: TYPE_TO_MODEL_CLASS[c.type] ?? "",
      }))
      .filter((e) => e.model_class !== "");
  }

  async function persist(overrides?: {
    is_done?: boolean;
    is_cancelled?: boolean;
  }) {
    if (!title.trim()) return;
    if (mode === "calendar" && !taskDate) return;
    if (mode === "planning" && !planningPeriod) return;
    const finalIsDone = overrides?.is_done ?? isDone;
    const finalIsCancelled = overrides?.is_cancelled ?? isCancelled;
    setSubmitting(true);
    try {
      const linked_entities = buildLinkedEntitiesPayload();
      if (mode === "calendar") {
        if (editing && task) {
          await api.patch<CalendarTask>(`/calendar-tasks/${task.id}`, {
            title: title.trim(),
            description: description || null,
            is_work: isWork,
            is_done: finalIsDone,
            is_cancelled: finalIsCancelled,
            task_date: taskDate,
            start_time: startTime || null,
            end_time: endTime || null,
            task_category_ids: categoryIds,
            linked_entities,
          });
          // Invalidate broadly so the destination day gets the new task too.
          queryClient.invalidateQueries({ queryKey: ["calendar"] });
        } else {
          const existing = [
            ...(dayQuery.data?.calendarTasks ?? []),
            ...(dayQuery.data?.calendarWorkTasks ?? []),
          ];
          const nextOrder =
            existing.reduce((m, t) => Math.max(m, t.order), -1) + 1;
          await api.post<CalendarTask>("/calendar-tasks", {
            task_date: taskDate,
            order: nextOrder,
            title: title.trim(),
            description: description || null,
            is_work: isWork,
            start_time: startTime || null,
            end_time: endTime || null,
            task_category_ids: categoryIds,
            linked_entities,
          });
          queryClient.invalidateQueries({ queryKey: calendarKeys.day(taskDate) });
          queryClient.invalidateQueries({ queryKey: calendarKeys.overview });
        }
      } else if (mode === "planning" && planningPeriod) {
        if (editing && planningTask) {
          await api.patch(`/planning-tasks/${planningTask.id}`, {
            content: title.trim(),
            description: description || null,
            is_work: isWork,
            is_done: finalIsDone,
            is_cancelled: finalIsCancelled,
            stars: stars ?? null,
            task_category_ids: categoryIds,
            linked_entities,
          });
        } else {
          await api.post("/planning-tasks", {
            start_date: planningPeriod.start_date,
            end_date: planningPeriod.end_date,
            planning_type_id: planningPeriod.planning_type_id,
            content: title.trim(),
            is_work: isWork,
            stars: stars ?? null,
            task_category_ids: categoryIds,
            linked_entities,
          });
        }
        queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
      } else if (mode === "outofplan") {
        if (editing && outOfPlanNote) {
          await api.patch(`/out-of-plan-notes/${outOfPlanNote.id}`, {
            content: title.trim(),
            description: description || null,
            is_work: isWork,
            is_done: finalIsDone,
            is_cancelled: finalIsCancelled,
            stars: stars ?? null,
            task_category_ids: categoryIds,
            linked_entities,
          });
        } else {
          await api.post("/out-of-plan-notes", {
            content: title.trim(),
            is_work: isWork,
            stars: stars ?? null,
            task_category_ids: categoryIds,
            linked_entities,
          });
        }
        queryClient.invalidateQueries({ queryKey: heavyKeys.outOfPlan });
      } else {
        console.warn(`TaskModal mode "${mode}" is not yet implemented.`);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await persist();
  }

  async function handleToggleDone() {
    const next = !isDone;

    if (next === true && mode === "calendar" && hasPendingSubtasks) {
      alert(
        `Complete all subtasks first (${pendingSubtasksCount} left).`,
      );
      return;
    }

    // For a calendar task being marked done that's linked to a planning task
    // (or sub-task), surface a confirm modal so the user can also mark the
    // linked planning row done in one shot.
    if (
      next === true &&
      editing &&
      mode === "calendar" &&
      task &&
      isCalendarLinkedToPlanning &&
      !((linkedPlanningSub ?? linkedPlanning)?.is_done ?? false)
    ) {
      setLinkConfirm({
        kind: linkedPlanningSub ? "subtask" : "task",
        content:
          linkedPlanningSub?.content ?? linkedPlanning?.content ?? "",
      });
      return;
    }

    setIsDone(next);
    if (editing) {
      await persist({ is_done: next });
    }
  }

  async function confirmLinkChoice(alsoMarkPlanning: boolean) {
    setLinkConfirm(null);
    setIsDone(true);
    try {
      if (alsoMarkPlanning) {
        if (linkedPlanningSub) {
          await updatePlanningSubTaskMut.mutateAsync({
            id: linkedPlanningSub.id,
            patch: {
              content: linkedPlanningSub.content,
              is_done: true,
            },
          });
        } else if (linkedPlanning) {
          await updatePlanningTaskMut.mutateAsync({
            id: linkedPlanning.id,
            patch: { is_done: true },
          });
        }
      }
    } finally {
      // Persist the calendar task last — its onClose() will tear down the
      // modal once everything is saved.
      await persist({ is_done: true });
    }
  }

  async function handleDelete() {
    if (isPlanning) {
      if (!planningTask) return;
      if (!confirm("Delete this planning task?")) return;
      setSubmitting(true);
      try {
        await removePlanning.mutateAsync(planningTask.id);
        onClose();
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (isOutOfPlan) {
      if (!outOfPlanNote) return;
      if (!confirm("Delete this note?")) return;
      setSubmitting(true);
      try {
        await removeOutOfPlan.mutateAsync(outOfPlanNote.id);
        onClose();
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!task) return;
    if (!confirm("Delete this task?")) return;
    setSubmitting(true);
    try {
      await removeCalendar.mutateAsync(task.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkipRegen() {
    if (!task) return;
    if (
      !confirm(
        "Delete this task and skip regeneration? The auto-task rule will not recreate it.",
      )
    )
      return;
    setSubmitting(true);
    try {
      await skipAndRemoveCalendar.mutateAsync(task.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div
          className={[
            "rounded-t-2xl p-5 border-l-4 flex-shrink-0",
            isWork
              ? "bg-orange-100 border-orange-400"
              : "bg-sky-100 border-sky-400",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-medium text-zinc-600">
                {editing
                  ? isPlanning
                    ? "Edit Planning Task"
                    : isOutOfPlan
                      ? "Edit Out of Plan Task"
                      : "Edit Task"
                  : isPlanning
                    ? "New Planning Task"
                    : isOutOfPlan
                      ? "New Out of Plan Task"
                      : "New Task"}
                {mode === "calendar" && taskDate ? ` — ${shortDateLabel(taskDate)}` : ""}
              </span>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={formLocked}
                placeholder="Task title…"
                className="mt-1 w-full bg-transparent text-xl font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsWork((p) => !p)}
                disabled={formLocked}
                title={isWork ? "Work" : "Personal"}
                className={[
                  "rounded-full p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  isWork
                    ? "bg-orange-200 text-orange-700 hover:bg-orange-300"
                    : "bg-white text-sky-700 hover:bg-zinc-100",
                ].join(" ")}
              >
                {isWork ? (
                  <HiBriefcase className="h-5 w-5" />
                ) : (
                  <HiUser className="h-5 w-5" />
                )}
              </button>
              {isCalendarLinkedToPlanning && (
                <span
                  title={`Linked to planning task: ${linkedPlanningSub?.content ?? linkedPlanning?.content ?? ""}`}
                  className="rounded-full p-2 text-blue-600 dark:text-blue-400"
                >
                  <HiLink className="h-5 w-5" />
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="rounded-full p-2 text-zinc-500 hover:bg-white/60"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">
          {(isBlocked || isDone) && (
            <div
              className={[
                "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                isBlocked
                  ? "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200",
              ].join(" ")}
            >
              {isBlocked ? (
                <HiLockClosed className="mt-0.5 h-4 w-4 flex-shrink-0" />
              ) : (
                <HiCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
              )}
              <span>
                {isBlocked
                  ? "This task is closed because the period was carried forward. It cannot be edited."
                  : "This task is completed. Mark it incomplete to edit."}
              </span>
            </div>
          )}
          {/* Status bar + categories */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleDone}
                disabled={
                  submitting || (!isDone && hasPendingSubtasks) || isBlocked
                }
                title={
                  isBlocked
                    ? "Closed tasks cannot be reopened from here"
                    : !isDone && hasPendingSubtasks
                      ? `Complete all subtasks first (${pendingSubtasksCount} left)`
                      : undefined
                }
                className={[
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                  isDone
                    ? "border-green-400 bg-green-50 text-green-700"
                    : "border-zinc-300 bg-zinc-50 text-zinc-600",
                ].join(" ")}
              >
                <HiCheck className="h-4 w-4" />
                {isDone ? "Completed" : "Complete"}
              </button>
              <button
                type="button"
                onClick={() => setIsCancelled((p) => !p)}
                disabled={formLocked}
                className={[
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  isCancelled
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-zinc-300 bg-zinc-50 text-zinc-600",
                ].join(" ")}
              >
                <HiNoSymbol className="h-4 w-4" />
                {isCancelled ? "Cancelled" : "Cancel"}
              </button>
            </div>
            <div className="relative" ref={categoryPickerRef}>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {selectedCategories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: c.color,
                      color: getContrastColor(c.color),
                    }}
                  >
                    {c.name}
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryIds((prev) =>
                          prev.filter((id) => id !== c.id),
                        )
                      }
                      disabled={formLocked}
                      title="Remove category"
                      className="rounded-full p-0.5 hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HiXMark className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker((p) => !p)}
                  disabled={formLocked}
                  title="Add category"
                  className="rounded-full border border-zinc-300 p-1 text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <HiPlus className="h-4 w-4" />
                </button>
              </div>
              {showCategoryPicker && (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border border-zinc-200 bg-white p-2 shadow-lg">
                  {allCategoriesQuery.isLoading ? (
                    <p className="px-2 py-1 text-xs text-zinc-500">Loading…</p>
                  ) : allCategories.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-zinc-500">
                      No categories yet.
                    </p>
                  ) : (
                    <ul className="max-h-60 overflow-y-auto">
                      {allCategories.map((c) => {
                        const selected = categoryIds.includes(c.id);
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => toggleCategory(c)}
                              className={[
                                "flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-sm",
                                selected
                                  ? "bg-zinc-100"
                                  : "hover:bg-zinc-50",
                              ].join(" ")}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.name}
                              </span>
                              {selected && <HiCheck className="h-4 w-4" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <section>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Description
            </label>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              disabled={formLocked}
              placeholder="Add a description…"
              rows={3}
              className="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </section>

          {/* Subtasks (edit mode only) — read fresh from cache so newly
              added subtasks show up after invalidation. */}
          {editing && mode === "calendar" && task && (
            <SubtasksSection date={date} taskId={task.id} />
          )}
          {editing && isPlanning && planningTask && (
            <PlanningSubtasksSection taskId={planningTask.id} />
          )}
          {editing && isOutOfPlan && outOfPlanNote && (
            <OutOfPlanSubnotesSection noteId={outOfPlanNote.id} />
          )}

          {/* Linked items */}
          <LinkedItemsSection
            chips={linkChips}
            onAdd={(chip) =>
              setLinkChips((prev) =>
                prev.some((c) => c.type === chip.type && c.id === chip.id)
                  ? prev
                  : [...prev, chip],
              )
            }
            onRemove={(chip) =>
              setLinkChips((prev) =>
                prev.filter(
                  (c) => !(c.type === chip.type && c.id === chip.id),
                ),
              )
            }
          />

          {/* Copy to Calendar (planning edit only) */}
          {editing && isPlanning && planningTask && (
            <CopyPlanningToCalendarSection
              taskId={planningTask.id}
              onCopied={onClose}
            />
          )}

          {/* Date & time (calendar) or Stars (planning / outofplan) */}
          {usesStars ? (
            <section>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Priority
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (stars ?? 0) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStars(stars === n ? null : n)}
                        disabled={formLocked}
                        className="p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                        title={`${n} star${n > 1 ? "s" : ""}`}
                      >
                        <HiStar
                          className={[
                            "h-6 w-6",
                            active
                              ? "text-yellow-400"
                              : "text-zinc-300 dark:text-zinc-600",
                          ].join(" ")}
                        />
                      </button>
                    );
                  })}
                </div>
                {stars != null && (
                  <button
                    type="button"
                    onClick={() => setStars(null)}
                    disabled={formLocked}
                    className="text-xs text-zinc-500 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Date &amp; time
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs text-zinc-500">Date</p>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    disabled={formLocked}
                    required
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-zinc-500">Start time</p>
                  <input
                    type="time"
                    value={startTime ?? ""}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={formLocked}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-zinc-500">End time</p>
                  <input
                    type="time"
                    value={endTime ?? ""}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={formLocked}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            {editing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                isDisabled={submitting}
                onClick={handleDelete}
                className="text-danger"
              >
                Delete
              </Button>
            )}
            {editing &&
              mode === "calendar" &&
              task &&
              task.auto_task_rule_id != null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isDisabled={submitting}
                  onClick={handleSkipRegen}
                  className="text-danger"
                >
                  Skip regen
                </Button>
              )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              isDisabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isDisabled={
                !title.trim() ||
                (mode === "calendar" && !taskDate) ||
                (mode === "planning" && !planningPeriod) ||
                submitting ||
                formLocked
              }
            >
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </form>

      {linkConfirm && (
        <LinkedPlanningConfirm
          kind={linkConfirm.kind}
          content={linkConfirm.content}
          onCancel={() => setLinkConfirm(null)}
          onChoose={confirmLinkChoice}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function LinkedPlanningConfirm({
  kind,
  content,
  onCancel,
  onChoose,
  submitting,
}: {
  kind: "task" | "subtask";
  content: string;
  onCancel: () => void;
  onChoose: (alsoMark: boolean) => void;
  submitting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-confirm-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-950">
        <div className="mb-3 flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
            <HiCheck className="h-4 w-4" />
          </span>
          <h3 id="link-confirm-title" className="text-base font-semibold">
            {kind === "subtask"
              ? "Mark planning sub-task as done?"
              : "Mark planning task as done?"}
          </h3>
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          This calendar task is linked to a planning{" "}
          {kind === "subtask" ? "sub-task" : "task"}:
        </p>
        <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          {content || "(no title)"}
        </div>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Do you also want to mark the planning{" "}
          {kind === "subtask" ? "sub-task" : "task"} as done?
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChoose(true)}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <HiCheck className="h-4 w-4" />
            Yes, mark done
          </button>
          <button
            type="button"
            onClick={() => onChoose(false)}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            <HiNoSymbol className="h-4 w-4" />
            No, keep pending
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subtasks section ───────────────────────────────────────────────────────

function SubtasksSection({
  date,
  taskId,
}: {
  date: string;
  taskId: number;
}) {
  const dayQuery = useCalendarDay(date);
  const create = useCreateCalendarSubTask(date);
  const [content, setContent] = useState("");

  const liveTask = useMemo(() => {
    if (!dayQuery.data) return null;
    return (
      dayQuery.data.calendarTasks.find((t) => t.id === taskId) ??
      dayQuery.data.calendarWorkTasks.find((t) => t.id === taskId) ??
      null
    );
  }, [dayQuery.data, taskId]);

  const sorted = (liveTask?.subTasks ?? [])
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <section>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Subtasks
      </label>
      <div className="space-y-1.5">
        {sorted.map((s) => (
          <SubtaskRow key={s.id} subTask={s} date={date} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!content.trim()) return;
              create.mutate(
                { calendar_task_id: taskId, content: content.trim() },
                { onSuccess: () => setContent("") },
              );
            }
          }}
          placeholder="Add subtask…"
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          isDisabled={!content.trim() || create.isPending}
          onClick={() => {
            if (!content.trim()) return;
            create.mutate(
              { calendar_task_id: taskId, content: content.trim() },
              { onSuccess: () => setContent("") },
            );
          }}
        >
          <span className="flex items-center gap-1">
            <HiPlus className="h-4 w-4" /> Add
          </span>
        </Button>
      </div>
    </section>
  );
}

function SubtaskRow({
  subTask,
  date,
}: {
  subTask: CalendarSubTask;
  date: string;
}) {
  const update = useUpdateCalendarSubTask(date);
  const remove = useDeleteCalendarSubTask(date);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTask.content);

  function commitEdit() {
    if (draft.trim() && draft !== subTask.content) {
      update.mutate({ id: subTask.id, patch: { content: draft.trim() } });
    }
    setEditing(false);
  }

  return (
    <div
      className={[
        "group flex items-center gap-2 rounded-lg px-3 py-2 ring-1 transition-colors",
        subTask.is_done
          ? "bg-green-50 ring-green-200"
          : "bg-zinc-50 ring-zinc-200 hover:ring-zinc-300",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() =>
          update.mutate({
            id: subTask.id,
            patch: { is_done: !subTask.is_done },
          })
        }
        disabled={update.isPending}
        className={[
          "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2",
          subTask.is_done
            ? "border-green-500 bg-green-500 text-white"
            : "border-zinc-300 hover:border-green-400 hover:bg-green-50",
        ].join(" ")}
      >
        {subTask.is_done && <HiCheck className="h-2.5 w-2.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setDraft(subTask.content);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        ) : (
          <p
            onClick={() => {
              setDraft(subTask.content);
              setEditing(true);
            }}
            className={[
              "cursor-pointer text-sm break-words",
              subTask.is_done ? "line-through opacity-50" : "text-zinc-800",
            ].join(" ")}
          >
            {subTask.content}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => remove.mutate(subTask.id)}
        disabled={remove.isPending}
        title="Delete"
        className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
      >
        <HiTrash className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Planning subtasks ──────────────────────────────────────────────────────

function PlanningSubtasksSection({ taskId }: { taskId: number }) {
  const queryClient = useQueryClient();
  const create = useCreatePlanningSubTask();
  const [content, setContent] = useState("");
  // Bump on any planning cache change so the memo below re-evaluates and
  // newly-added subtasks render without closing/reopening the modal.
  const [cacheTick, setCacheTick] = useState(0);
  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const unsubscribe = cache.subscribe((event) => {
      const key = event?.query?.queryKey;
      if (Array.isArray(key) && key[0] === "planning") {
        setCacheTick((t) => t + 1);
      }
    });
    return unsubscribe;
  }, [queryClient]);

  // Pull the latest planning task subtasks from any cached planning query so
  // the modal reflects newly-added subtasks after invalidation. Backend
  // serializes the relation as `sub_tasks` (snake_case); fall back to the
  // camelCase form in case any caller normalizes it.
  const subTasks = useMemo<PlanningSubTaskLite[]>(() => {
    const queries = queryClient.getQueriesData<unknown>({
      queryKey: heavyKeys.planning,
    });
    for (const [, data] of queries) {
      if (!data || typeof data !== "object") continue;
      const summary = data as {
        monthlyPlanning?: { tasks?: PlanningTaskLite[] } | null;
        yearlyPlanning?: { tasks?: PlanningTaskLite[] } | null;
      };
      for (const period of [summary.monthlyPlanning, summary.yearlyPlanning]) {
        if (!period?.tasks) continue;
        const match = period.tasks.find((t) => t.id === taskId);
        const subs = match?.sub_tasks ?? match?.subTasks;
        if (subs) return subs;
      }
    }
    return [];
  }, [queryClient, taskId, cacheTick]);

  const sorted = subTasks.slice().sort((a, b) => a.order - b.order);

  return (
    <section>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Subtasks
      </label>
      <div className="space-y-1.5">
        {sorted.map((s) => (
          <PlanningSubtaskRow key={s.id} subTask={s} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!content.trim()) return;
              create.mutate(
                { planning_task_id: taskId, content: content.trim() },
                { onSuccess: () => setContent("") },
              );
            }
          }}
          placeholder="Add subtask…"
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          isDisabled={!content.trim() || create.isPending}
          onClick={() => {
            if (!content.trim()) return;
            create.mutate(
              { planning_task_id: taskId, content: content.trim() },
              { onSuccess: () => setContent("") },
            );
          }}
        >
          <span className="flex items-center gap-1">
            <HiPlus className="h-4 w-4" /> Add
          </span>
        </Button>
      </div>
    </section>
  );
}

function PlanningSubtaskRow({ subTask }: { subTask: PlanningSubTaskLite }) {
  const update = useUpdatePlanningSubTask();
  const remove = useDeletePlanningSubTask();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTask.content);
  const blocked = subTask.is_blocked === true;

  function commitEdit() {
    if (draft.trim() && draft !== subTask.content) {
      // Backend treats missing is_done as false, so always pass it through.
      update.mutate({
        id: subTask.id,
        patch: { content: draft.trim(), is_done: subTask.is_done },
      });
    }
    setEditing(false);
  }

  return (
    <div
      className={[
        "group flex items-center gap-2 rounded-lg px-3 py-2 ring-1 transition-colors",
        subTask.is_done
          ? "bg-green-50 ring-green-200"
          : "bg-zinc-50 ring-zinc-200 hover:ring-zinc-300",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() =>
          update.mutate({
            id: subTask.id,
            patch: { content: subTask.content, is_done: !subTask.is_done },
          })
        }
        disabled={update.isPending || blocked}
        className={[
          "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2",
          subTask.is_done
            ? "border-green-500 bg-green-500 text-white"
            : "border-zinc-300 hover:border-green-400 hover:bg-green-50",
        ].join(" ")}
      >
        {subTask.is_done && <HiCheck className="h-2.5 w-2.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setDraft(subTask.content);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        ) : (
          <p
            onClick={() => {
              if (blocked) return;
              setDraft(subTask.content);
              setEditing(true);
            }}
            className={[
              "cursor-pointer text-sm break-words",
              subTask.is_done ? "line-through opacity-50" : "text-zinc-800",
              blocked ? "italic text-zinc-400" : "",
            ].join(" ")}
          >
            {subTask.content}
          </p>
        )}
      </div>
      {!blocked && (
        <button
          type="button"
          onClick={() => remove.mutate(subTask.id)}
          disabled={remove.isPending}
          title="Delete"
          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
        >
          <HiTrash className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Out-of-plan subnotes ───────────────────────────────────────────────────

function OutOfPlanSubnotesSection({ noteId }: { noteId: number }) {
  const queryClient = useQueryClient();
  const create = useCreateOutOfPlanSubNote();
  const [content, setContent] = useState("");

  const subNotes = useMemo<OutOfPlanSubNote[]>(() => {
    const data = queryClient.getQueryData<{ outOfPlanNotes?: OutOfPlanNote[] }>(
      heavyKeys.outOfPlan,
    );
    const note = data?.outOfPlanNotes?.find((n) => n.id === noteId);
    return note?.subNotes ?? [];
  }, [queryClient, noteId]);

  const sorted = subNotes.slice().sort((a, b) => a.order - b.order);

  return (
    <section>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Subnotes
      </label>
      <div className="space-y-1.5">
        {sorted.map((s) => (
          <OutOfPlanSubnoteRow key={s.id} subNote={s} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!content.trim()) return;
              create.mutate(
                { out_of_plan_note_id: noteId, content: content.trim() },
                { onSuccess: () => setContent("") },
              );
            }
          }}
          placeholder="Add subnote…"
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          isDisabled={!content.trim() || create.isPending}
          onClick={() => {
            if (!content.trim()) return;
            create.mutate(
              { out_of_plan_note_id: noteId, content: content.trim() },
              { onSuccess: () => setContent("") },
            );
          }}
        >
          <span className="flex items-center gap-1">
            <HiPlus className="h-4 w-4" /> Add
          </span>
        </Button>
      </div>
    </section>
  );
}

function OutOfPlanSubnoteRow({ subNote }: { subNote: OutOfPlanSubNote }) {
  const update = useUpdateOutOfPlanSubNote();
  const remove = useDeleteOutOfPlanSubNote();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subNote.content);

  function commitEdit() {
    if (draft.trim() && draft !== subNote.content) {
      update.mutate({
        id: subNote.id,
        patch: { content: draft.trim(), is_done: subNote.is_done },
      });
    }
    setEditing(false);
  }

  return (
    <div
      className={[
        "group flex items-center gap-2 rounded-lg px-3 py-2 ring-1 transition-colors",
        subNote.is_done
          ? "bg-green-50 ring-green-200"
          : "bg-zinc-50 ring-zinc-200 hover:ring-zinc-300",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() =>
          update.mutate({
            id: subNote.id,
            patch: { content: subNote.content, is_done: !subNote.is_done },
          })
        }
        disabled={update.isPending}
        className={[
          "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2",
          subNote.is_done
            ? "border-green-500 bg-green-500 text-white"
            : "border-zinc-300 hover:border-green-400 hover:bg-green-50",
        ].join(" ")}
      >
        {subNote.is_done && <HiCheck className="h-2.5 w-2.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setDraft(subNote.content);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        ) : (
          <p
            onClick={() => {
              setDraft(subNote.content);
              setEditing(true);
            }}
            className={[
              "cursor-pointer text-sm break-words",
              subNote.is_done ? "line-through opacity-50" : "text-zinc-800",
            ].join(" ")}
          >
            {subNote.content}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => remove.mutate(subNote.id)}
        disabled={remove.isPending}
        title="Delete"
        className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
      >
        <HiTrash className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Linked items section ───────────────────────────────────────────────────

function LinkedItemsSection({
  chips,
  onAdd,
  onRemove,
}: {
  chips: LinkChip[];
  onAdd: (chip: LinkChip) => void;
  onRemove: (chip: LinkChip) => void;
}) {
  const [query, setQuery] = useState("");
  const search = useSecondBrainSearch(query);
  const showResults = query.trim().length >= 2;

  return (
    <section>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Link items
      </label>

      {chips.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={`${c.type}-${c.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
            >
              <HiLink className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wide text-blue-500">
                {TYPE_LABEL[c.type] ?? c.type}
              </span>
              <span>{c.label}</span>
              <button
                type="button"
                onClick={() => onRemove(c)}
                title="Unlink"
                className="rounded-full p-0.5 hover:bg-blue-100"
              >
                <HiXMark className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks, notes, people…"
          className="w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {showResults && (
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg">
            {search.isLoading ? (
              <p className="px-3 py-2 text-xs text-zinc-500">Searching…</p>
            ) : !search.data || search.data.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-500">No matches.</p>
            ) : (
              <ul>
                {search.data.map((r) => {
                  const already = chips.some(
                    (c) => c.type === r.type && c.id === r.id,
                  );
                  const supported = !!TYPE_TO_MODEL_CLASS[r.type];
                  return (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        type="button"
                        disabled={already || !supported}
                        onClick={() => {
                          onAdd({
                            type: r.type,
                            id: r.id,
                            label: r.title,
                          });
                          setQuery("");
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                          already || !supported
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-zinc-50",
                        ].join(" ")}
                      >
                        <span className="flex flex-col min-w-0">
                          <span className="truncate font-medium">
                            {r.title}
                          </span>
                          {r.subtitle && (
                            <span className="truncate text-xs text-zinc-500">
                              {r.subtitle}
                            </span>
                          )}
                        </span>
                        <span className="flex-shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase text-zinc-600">
                          {r.type_label || TYPE_LABEL[r.type] || r.type}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function CopyPlanningToCalendarSection({
  taskId,
  onCopied,
}: {
  taskId: number;
  onCopied: () => void;
}) {
  const copy = useCopyPlanningToCalendar();
  const [date, setDate] = useState<string>(() => todayString());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Pick a valid date.");
      return;
    }
    setError(null);
    try {
      await copy.mutateAsync({
        taskId,
        taskDate: date,
        startTime: startTime || null,
        endTime: endTime || null,
      });
      onCopied();
    } catch (e) {
      const data = (e as { response?: { data?: { message?: string } } })
        .response?.data;
      setError(data?.message ?? "Failed to copy task.");
    }
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        <HiCalendarDays className="h-4 w-4 text-zinc-500" />
        <h3 className="text-sm font-semibold">Copy to Calendar</h3>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="copy-cal-date"
            className="text-xs font-medium text-zinc-500"
          >
            Date
          </label>
          <input
            id="copy-cal-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">
            Time <span className="text-zinc-400">(optional)</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-950"
              aria-label="Start time"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-950"
              aria-label="End time"
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={copy.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {copy.isPending ? "Copying…" : "Copy to Calendar"}
        </button>
      </div>
    </section>
  );
}
