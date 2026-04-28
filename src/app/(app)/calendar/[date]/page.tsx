"use client";

import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { use, useState } from "react";

import {
  useCalendarDay,
  useCreateCalendarTask,
  useDeleteCalendarTask,
  useUpdateCalendarTask,
} from "@/lib/queries/calendar";
import type { CalendarTask } from "@/types/calendar";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const DATE_FORMAT = new Intl.DateTimeFormat("en", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function TaskRow({
  task,
  prev,
  next,
  date,
}: {
  task: CalendarTask;
  prev: CalendarTask | null;
  next: CalendarTask | null;
  date: string;
}) {
  const update = useUpdateCalendarTask(date);
  const remove = useDeleteCalendarTask(date);

  async function swapOrder(other: CalendarTask) {
    await Promise.all([
      update.mutateAsync({
        id: task.id,
        patch: { title: task.title, order: other.order },
      }),
      update.mutateAsync({
        id: other.id,
        patch: { title: other.title, order: task.order },
      }),
    ]);
  }

  return (
    <li className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={task.is_done}
        onChange={(e) =>
          update.mutate({
            id: task.id,
            patch: { title: task.title, is_done: e.target.checked },
          })
        }
        disabled={update.isPending}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar/${date}/${task.id}`}
            className={[
              "truncate font-medium hover:underline",
              task.is_done ? "text-zinc-400 line-through" : "",
            ].join(" ")}
          >
            {task.title}
          </Link>
          {task.start_time ? (
            <span className="text-xs text-zinc-500">
              {task.start_time}
              {task.end_time ? `–${task.end_time}` : ""}
            </span>
          ) : null}
        </div>
        {task.description ? (
          <p className="mt-1 text-sm text-zinc-500">{task.description}</p>
        ) : null}
        {task.taskCategories.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.taskCategories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: `${cat.color}20`,
                  color: cat.color,
                }}
              >
                {cat.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
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
      </div>
      <Button
        variant="ghost"
        size="sm"
        isDisabled={remove.isPending}
        onClick={() => {
          if (confirm("Delete this task?")) remove.mutate(task.id);
        }}
      >
        Delete
      </Button>
    </li>
  );
}

function CreateTaskForm({
  date,
  isWork,
  nextOrder,
}: {
  date: string;
  isWork: boolean;
  nextOrder: number;
}) {
  const create = useCreateCalendarTask(date);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        create.mutate(
          {
            task_date: date,
            order: nextOrder,
            title: title.trim(),
            is_work: isWork,
            start_time: startTime || null,
          },
          {
            onSuccess: () => {
              setTitle("");
              setStartTime("");
            },
          },
        );
      }}
    >
      <div className="flex-1">
        <Input
          type="text"
          placeholder={`Add a ${isWork ? "work" : "personal"} task…`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="w-24">
        <Input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="sm"
        isDisabled={!title.trim() || create.isPending}
      >
        Add
      </Button>
    </form>
  );
}

export default function CalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const valid = DATE_RE.test(date);
  const { data, isLoading, error } = useCalendarDay(valid ? date : "");

  if (!valid) {
    return (
      <div className="p-6 text-sm text-danger">
        Invalid date. Dates must be in <code>YYYY-MM-DD</code> format.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-zinc-500">Loading…</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this day.
      </div>
    );
  }

  const dateLabel = DATE_FORMAT.format(new Date(`${date}T00:00:00`));
  const personalTasks = data.calendarTasks
    .slice()
    .sort((a, b) => a.order - b.order);
  const workTasks = data.calendarWorkTasks
    .slice()
    .sort((a, b) => a.order - b.order);
  const personalNextOrder =
    personalTasks.reduce((m, t) => Math.max(m, t.order), -1) + 1;
  const workNextOrder =
    workTasks.reduce((m, t) => Math.max(m, t.order), -1) + 1;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/calendar"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Back to calendar
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{dateLabel}</h1>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Personal ({personalTasks.length})
        </h2>
        {personalTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">No personal tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {personalTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                prev={i > 0 ? personalTasks[i - 1] : null}
                next={
                  i < personalTasks.length - 1 ? personalTasks[i + 1] : null
                }
                date={date}
              />
            ))}
          </ul>
        )}
        <CreateTaskForm
          date={date}
          isWork={false}
          nextOrder={personalNextOrder}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Work ({workTasks.length})
        </h2>
        {workTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">No work tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {workTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                prev={i > 0 ? workTasks[i - 1] : null}
                next={i < workTasks.length - 1 ? workTasks[i + 1] : null}
                date={date}
              />
            ))}
          </ul>
        )}
        <CreateTaskForm date={date} isWork={true} nextOrder={workNextOrder} />
      </section>
    </div>
  );
}
