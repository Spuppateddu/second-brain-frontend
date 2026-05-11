"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import {
  HiArrowLongDown,
  HiArrowLongLeft,
  HiArrowLongUp,
  HiCheckCircle,
  HiPlus,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import { CalendarTaskLinksPanel } from "@/components/CalendarTaskLinksPanel";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { Textarea } from "@/components/UI/Textarea";
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
        className="h-4 w-4 accent-primary-600"
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
          subTask.is_done
            ? "text-secondary-400 line-through dark:text-secondary-500"
            : "text-secondary-800 dark:text-secondary-200",
        ].join(" ")}
      >
        {subTask.content}
      </span>
      <IconButton
        size="xs"
        variant="ghost"
        label="Move up"
        disabled={!prev || update.isPending}
        onClick={() => prev && swapOrder(prev)}
      >
        <HiArrowLongUp />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        label="Move down"
        disabled={!next || update.isPending}
        onClick={() => next && swapOrder(next)}
      >
        <HiArrowLongDown />
      </IconButton>
      <IconButton
        size="xs"
        variant="danger"
        label="Delete subtask"
        onClick={() => {
          if (confirm("Delete this subtask?")) remove.mutate(subTask.id);
        }}
      >
        <HiXMark />
      </IconButton>
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
    <main className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <Link href={`/calendar/${date}`}>
            <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
              Back to {DATE_FORMAT.format(new Date(`${date}T00:00:00`))}
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {savedAt && !dirty ? (
              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              loading={update.isPending}
              disabled={!title.trim() || update.isPending || !dirty}
              onClick={save}
            >
              Save
            </Button>
            <IconButton
              size="sm"
              variant={task.is_done ? "secondary" : "success"}
              label={task.is_done ? "Mark undone" : "Mark done"}
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  id: task.id,
                  patch: { is_done: !task.is_done },
                })
              }
            >
              <HiCheckCircle />
            </IconButton>
            <IconButton
              size="sm"
              variant="danger"
              label="Delete task"
              disabled={remove.isPending}
              onClick={destroy}
            >
              <HiTrash />
            </IconButton>
          </div>
        </header>

        <FormSection title="Details">
          <Input
            label="Title"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            fullWidth
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Start time"
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setDirty(true);
              }}
              fullWidth
            />
            <Input
              label="End time"
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setDirty(true);
              }}
              fullWidth
            />
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDirty(true);
            }}
            className="min-h-[120px]"
            fullWidth
          />
        </FormSection>

        <FormSection title={`Subtasks (${subTasks.length})`}>
          {subTasks.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              No subtasks yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
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
          <form className="flex items-end gap-2" onSubmit={addSubTask}>
            <Input
              type="text"
              placeholder="Add a subtask…"
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              className="flex-1"
              fullWidth
            />
            <IconButton
              type="submit"
              size="md"
              variant="primary"
              label="Add subtask"
              disabled={!newSubTask.trim() || createSubTask.isPending}
              loading={createSubTask.isPending}
            >
              <HiPlus />
            </IconButton>
          </form>
        </FormSection>

        {task.taskCategories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              Categories
            </span>
            {task.taskCategories.map((cat) => (
              <Badge key={cat.id}>
                <span
                  className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden
                />
                {cat.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <CalendarTaskLinksPanel task={task} date={date} />

        {error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
        ) : null}
      </div>
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
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-3xl text-sm text-danger-600 dark:text-danger-400">
          Invalid task id.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-3xl text-sm text-secondary-500">
          Loading…
        </p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-3xl text-sm text-danger-600 dark:text-danger-400">
          Couldn&rsquo;t load this task.
        </p>
      </main>
    );
  }

  const task =
    data.calendarTasks.find((t) => t.id === id) ??
    data.calendarWorkTasks.find((t) => t.id === id);

  if (!task) {
    return (
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-3xl text-sm text-danger-600 dark:text-danger-400">
          Task not found on this date.
        </p>
      </main>
    );
  }

  return <TaskEditor task={task} date={date} key={task.id} />;
}
