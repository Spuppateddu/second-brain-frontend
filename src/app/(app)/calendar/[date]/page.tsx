"use client";

import Link from "next/link";
import { use, useState } from "react";
import {
  HiArrowLongLeft,
  HiArrowLongDown,
  HiArrowLongUp,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
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
    <li className="flex items-start gap-3 rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-primary-600"
        checked={task.is_done}
        onChange={(e) =>
          update.mutate({
            id: task.id,
            patch: { title: task.title, is_done: e.target.checked },
          })
        }
        disabled={update.isPending}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/calendar/${date}/${task.id}`}
            className={[
              "truncate font-medium hover:underline",
              task.is_done
                ? "text-secondary-400 line-through dark:text-secondary-500"
                : "text-secondary-900 dark:text-secondary-100",
            ].join(" ")}
          >
            {task.title}
          </Link>
          {task.start_time ? (
            <Badge variant="info">
              {task.start_time}
              {task.end_time ? `–${task.end_time}` : ""}
            </Badge>
          ) : null}
        </div>
        {task.description ? (
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            {task.description}
          </p>
        ) : null}
        {task.taskCategories.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.taskCategories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
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
      </div>
      <IconButton
        size="sm"
        variant="danger"
        label="Delete"
        disabled={remove.isPending}
        onClick={() => {
          if (confirm("Delete this task?")) remove.mutate(task.id);
        }}
      >
        <HiTrash />
      </IconButton>
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
      <Input
        type="text"
        placeholder={`Add a ${isWork ? "work" : "personal"} task…`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
        fullWidth
      />
      <Input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="w-28"
      />
      <IconButton
        type="submit"
        variant="primary"
        size="md"
        label="Add task"
        disabled={!title.trim() || create.isPending}
        loading={create.isPending}
      >
        <HiPlus />
      </IconButton>
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
      <div className="p-4 sm:p-6 lg:py-10">
        <div className="mx-auto max-w-3xl text-sm text-danger-600 dark:text-danger-400">
          Invalid date. Dates must be in <code>YYYY-MM-DD</code> format.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-3xl text-sm text-secondary-500">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-3xl text-sm text-danger-600 dark:text-danger-400">
          Couldn&rsquo;t load this day.
        </p>
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link href="/calendar">
            <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
              Back to calendar
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            {dateLabel}
          </h1>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Personal ({personalTasks.length})
          </h2>
          {personalTasks.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              No personal tasks yet.
            </p>
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
          <h2 className="text-sm font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Work ({workTasks.length})
          </h2>
          {workTasks.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              No work tasks yet.
            </p>
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
    </div>
  );
}
