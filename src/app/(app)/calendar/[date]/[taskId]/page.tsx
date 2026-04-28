"use client";

import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { CalendarTaskLinksPanel } from "@/components/CalendarTaskLinksPanel";
import {
  useCalendarDay,
  useCreateCalendarSubTask,
  useDeleteCalendarSubTask,
  useDeleteCalendarTask,
  useUpdateCalendarSubTask,
  useUpdateCalendarTask,
} from "@/lib/queries/calendar";
import type { CalendarSubTask, CalendarTask } from "@/types/calendar";

const DATE_FORMAT = new Intl.DateTimeFormat("en", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function SubTaskRow({
  subTask,
  prev,
  next,
  date,
}: {
  subTask: CalendarSubTask;
  prev: CalendarSubTask | null;
  next: CalendarSubTask | null;
  date: string;
}) {
  const update = useUpdateCalendarSubTask(date);
  const remove = useDeleteCalendarSubTask(date);

  async function swapOrder(other: CalendarSubTask) {
    await Promise.all([
      update.mutateAsync({
        id: subTask.id,
        patch: {
          is_done: subTask.is_done,
          content: subTask.content,
          order: other.order,
        },
      }),
      update.mutateAsync({
        id: other.id,
        patch: {
          is_done: other.is_done,
          content: other.content,
          order: subTask.order,
        },
      }),
    ]);
  }

  return (
    <li className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={subTask.is_done}
        onChange={(e) =>
          update.mutate({
            id: subTask.id,
            patch: {
              is_done: e.target.checked,
              content: subTask.content,
            },
          })
        }
        disabled={update.isPending}
      />
      <span
        className={[
          "flex-1 truncate",
          subTask.is_done ? "text-zinc-400 line-through" : "",
        ].join(" ")}
      >
        {subTask.content}
      </span>
      <button
        type="button"
        title="Move up"
        disabled={!prev || update.isPending}
        onClick={() => prev && swapOrder(prev)}
        className="rounded px-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
      >
        ↑
      </button>
      <button
        type="button"
        title="Move down"
        disabled={!next || update.isPending}
        onClick={() => next && swapOrder(next)}
        className="rounded px-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm("Delete this subtask?")) remove.mutate(subTask.id);
        }}
        className="text-xs text-zinc-500 hover:text-danger"
      >
        ×
      </button>
    </li>
  );
}

function TaskEditor({ task, date }: { task: CalendarTask; date: string }) {
  const router = useRouter();
  const update = useUpdateCalendarTask(date);
  const remove = useDeleteCalendarTask(date);
  const createSubTask = useCreateCalendarSubTask(date);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [startTime, setStartTime] = useState(task.start_time ?? "");
  const [endTime, setEndTime] = useState(task.end_time ?? "");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSubTask, setNewSubTask] = useState("");

  const subTasks = (task.subTasks ?? [])
    .slice()
    .sort((a, b) => a.order - b.order);

  async function save() {
    setError(null);
    try {
      await update.mutateAsync({
        id: task.id,
        patch: {
          title,
          description: description || null,
          start_time: startTime || null,
          end_time: endTime || null,
        },
      });
      setDirty(false);
      setSavedAt(new Date());
    } catch (err) {
      const m =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(m);
    }
  }

  async function destroy() {
    if (!confirm("Delete this task? This can't be undone.")) return;
    try {
      await remove.mutateAsync(task.id);
      router.push(`/calendar/${date}`);
    } catch {
      setError("Failed to delete.");
    }
  }

  async function addSubTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubTask.trim()) return;
    try {
      await createSubTask.mutateAsync({
        calendar_task_id: task.id,
        content: newSubTask.trim(),
      });
      setNewSubTask("");
    } catch {
      setError("Failed to add subtask.");
    }
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/calendar/${date}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to {DATE_FORMAT.format(new Date(`${date}T00:00:00`))}
        </Link>
        <div className="flex items-center gap-2">
          {savedAt && !dirty ? (
            <span className="text-xs text-zinc-500">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            isDisabled={!title.trim() || update.isPending || !dirty}
            onClick={save}
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            isDisabled={update.isPending}
            onClick={() =>
              update.mutate({
                id: task.id,
                patch: { is_done: !task.is_done },
              })
            }
          >
            {task.is_done ? "Mark undone" : "Mark done"}
          </Button>
          <Button
            variant="danger-soft"
            size="sm"
            isDisabled={remove.isPending}
            onClick={destroy}
          >
            Delete
          </Button>
        </div>
      </div>

      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Start time
          </span>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            End time
          </span>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              setDirty(true);
            }}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Description
        </span>
        <textarea
          className="min-h-[120px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setDirty(true);
          }}
        />
      </label>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Subtasks ({subTasks.length})
        </h2>
        {subTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">No subtasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            {subTasks.map((sub, i) => (
              <SubTaskRow
                key={sub.id}
                subTask={sub}
                prev={i > 0 ? subTasks[i - 1] : null}
                next={i < subTasks.length - 1 ? subTasks[i + 1] : null}
                date={date}
              />
            ))}
          </ul>
        )}
        <form className="flex items-center gap-2" onSubmit={addSubTask}>
          <Input
            type="text"
            placeholder="Add a subtask…"
            value={newSubTask}
            onChange={(e) => setNewSubTask(e.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            isDisabled={!newSubTask.trim() || createSubTask.isPending}
          >
            Add
          </Button>
        </form>
      </section>

      {task.taskCategories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Categories
          </span>
          {task.taskCategories.map((cat) => (
            <span
              key={cat.id}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      ) : null}

      <CalendarTaskLinksPanel task={task} date={date} />

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </main>
  );
}

export default function CalendarTaskDetailPage({
  params,
}: {
  params: Promise<{ date: string; taskId: string }>;
}) {
  const { date, taskId } = use(params);
  const id = Number(taskId);
  const { data, isLoading, error } = useCalendarDay(date);

  if (Number.isNaN(id)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid task id.</p>
      </main>
    );
  }

  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading…</main>;
  }

  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this task.
      </main>
    );
  }

  const task =
    data.calendarTasks.find((t) => t.id === id) ??
    data.calendarWorkTasks.find((t) => t.id === id);

  if (!task) {
    return (
      <main className="p-6 text-sm text-danger">
        Task not found on this date.
      </main>
    );
  }

  return <TaskEditor task={task} date={date} key={task.id} />;
}
