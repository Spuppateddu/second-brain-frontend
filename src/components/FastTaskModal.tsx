"use client";

import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { calendarKeys, useCreateCalendarTask } from "@/lib/queries/calendar";
import type { CalendarDayPayload } from "@/types/calendar";

type Props = {
  open: boolean;
  onClose: () => void;
};

function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function FastTaskModal({ open, onClose }: Props) {
  const today = todayString();
  const queryClient = useQueryClient();
  const createTask = useCreateCalendarTask(today);
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saving = createTask.isPending;

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setError(null);
      return;
    }
    const t = setTimeout(() => titleRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!saving) onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, description, saving]);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setError(null);

    const day = queryClient.getQueryData<CalendarDayPayload>(
      calendarKeys.day(today),
    );
    const existing = [
      ...(day?.calendarTasks ?? []),
      ...(day?.calendarWorkTasks ?? []),
    ];
    const nextOrder =
      existing.reduce((m, t) => Math.max(m, t.order), -1) + 1;

    try {
      await createTask.mutateAsync({
        task_date: today,
        order: nextOrder,
        title: trimmed,
        description: description.trim() || null,
        is_work: false,
      });
      onClose();
    } catch {
      setError("Failed to create task. Try again.");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-2 backdrop-blur-sm sm:p-4"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="mt-10 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold">Quick Task</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {today}
          </span>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            maxLength={255}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional) — ⌘/Ctrl + Enter to save"
            rows={4}
            className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            isDisabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={save}
            isDisabled={!title.trim() || saving}
          >
            {saving ? "Adding…" : "Add Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}
