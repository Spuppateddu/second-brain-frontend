"use client";

import { useMemo, useState } from "react";
import {
  HiChevronDown,
  HiMagnifyingGlass,
  HiPlus,
  HiQueueList,
  HiStar,
} from "react-icons/hi2";

import { TaskModal } from "@/components/calendar/TaskModal";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { useOutOfPlan } from "@/lib/queries/heavy";
import type { OutOfPlanNote } from "@/types/heavy";

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
            i < stars
              ? "text-yellow-400"
              : "text-secondary-300 dark:text-secondary-600",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

function NoteRow({
  note,
  onOpen,
}: {
  note: OutOfPlanNote;
  onOpen: (n: OutOfPlanNote) => void;
}) {
  const isWork = !!note.is_work;
  const isDone = !!note.is_done;
  const isCancelled = !!note.is_cancelled;
  const categories = note.taskCategories ?? note.task_categories ?? [];

  const borderColor = isWork ? "border-l-orange-400" : "border-l-cyan-400";
  const bgColor = isWork
    ? "bg-orange-50/40 dark:bg-orange-500/5"
    : "bg-white dark:bg-secondary-900";

  const titleStyle = isCancelled
    ? "line-through text-secondary-400"
    : isDone
      ? "text-secondary-400 dark:text-secondary-500"
      : "text-secondary-800 dark:text-secondary-100";

  return (
    <button
      type="button"
      onClick={() => onOpen(note)}
      className={[
        "group flex w-full items-center gap-3 rounded-[var(--radius-control)] border border-secondary-200 border-l-4 px-3 py-1.5 text-left transition-colors hover:bg-secondary-50 dark:border-secondary-800 dark:hover:bg-secondary-900/60",
        borderColor,
        bgColor,
      ].join(" ")}
    >
      <span className={["flex-1 text-sm", titleStyle].join(" ")}>
        {note.content}
      </span>
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
  notes,
  onOpen,
  defaultOpen,
}: {
  stars: number;
  notes: OutOfPlanNote[];
  onOpen: (n: OutOfPlanNote) => void;
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
            <span className="text-sm text-secondary-600 dark:text-secondary-300">
              No stars
            </span>
          )}
          <span className="text-xs text-secondary-500">({notes.length})</span>
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
          {notes.map((n) => (
            <div
              key={n.id}
              className="flex min-w-full sm:min-w-[calc(50%-0.25rem)] flex-1"
            >
              <NoteRow note={n} onOpen={onOpen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OutOfPlanPage() {
  const { data, isLoading, error } = useOutOfPlan();
  const [taskSectionOpen, setTaskSectionOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState<OutOfPlanNote | null>(null);

  const notes = useMemo<OutOfPlanNote[]>(() => {
    const list = data?.outOfPlanNotes ?? [];
    return list.slice().sort((a, b) => {
      const sa = a.stars ?? 0;
      const sb = b.stars ?? 0;
      if (sa !== sb) return sb - sa;
      return a.order - b.order;
    });
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.content.toLowerCase().includes(q));
  }, [notes, search]);

  const groups = useMemo(() => {
    const buckets = new Map<number, OutOfPlanNote[]>();
    for (const n of filtered) {
      const key = n.stars ?? 0;
      const list = buckets.get(key);
      if (list) list.push(n);
      else buckets.set(key, [n]);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => a - b);
  }, [filtered]);

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

  function openCreate() {
    setModalNote(null);
    setModalOpen(true);
  }
  function openEdit(n: OutOfPlanNote) {
    setModalNote(n);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalNote(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white px-4 py-3 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Out of Plan Tasks
            </h1>
            <IconButton
              variant="primary"
              size="sm"
              label="Add task"
              onClick={openCreate}
            >
              <HiPlus />
            </IconButton>
          </div>

          <div className="mt-4">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks or media…"
              leftIcon={<HiMagnifyingGlass className="h-4 w-4" />}
              fullWidth
            />
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-secondary-500 dark:text-secondary-400">
              Loading…
            </p>
          ) : error ? (
            <p className="mt-4 text-sm text-danger-600 dark:text-danger-400">
              Couldn&rsquo;t load the notes. Try refreshing.
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
                      Nothing out of plan right now.
                    </p>
                  ) : (
                    groups.map(([stars, list]) => (
                      <StarGroup
                        key={stars}
                        stars={stars}
                        notes={list}
                        onOpen={openEdit}
                        defaultOpen={defaultOpenStars.has(stars)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <TaskModal
          open={modalOpen}
          onClose={closeModal}
          mode="outofplan"
          outOfPlanNote={modalNote}
        />
      </div>
    </div>
  );
}
