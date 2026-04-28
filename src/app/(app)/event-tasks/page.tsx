"use client";

import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { api } from "@/lib/api";
import {
  entityKeys,
  useDeleteEventTask,
  useEventTasks,
} from "@/lib/queries/entities";
import type { EventTask } from "@/types/entities";

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function EventTasksPage() {
  const { data, isLoading, error } = useEventTasks();
  const queryClient = useQueryClient();
  const eventTasks = data ?? [];
  const remove = useDeleteEventTask();

  const toggleActive = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/event-tasks/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.eventTasks });
    },
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event task?")) return;
    await remove.mutateAsync(id);
  };

  const sortedEvents = [...eventTasks].sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    if (a.day !== b.day) return a.day - b.day;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Event Tasks</h1>
        <Link href="/event-tasks/new">
          <Button variant="primary" size="sm">
            Add New Event
          </Button>
        </Link>
      </header>

      {error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the event tasks. Try refreshing.
        </p>
      ) : isLoading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
      ) : eventTasks.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-zinc-500 dark:text-zinc-400">
            No event tasks configured yet.
          </p>
          <Link href="/event-tasks/new">
            <Button variant="primary">Create Your First Event</Button>
          </Link>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl space-y-4">
          {sortedEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onToggleActive={() => toggleActive.mutate(event.id)}
              onDelete={() => handleDelete(event.id)}
              isToggling={toggleActive.isPending}
              isDeleting={remove.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({
  event,
  onToggleActive,
  onDelete,
  isToggling,
  isDeleting,
}: {
  event: EventTask;
  onToggleActive: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-base font-semibold sm:text-lg">{event.name}</h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Event
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                event.is_active
                  ? "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {event.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-primary-600 dark:text-primary-400">
            {SHORT_MONTHS[event.month - 1]} {event.day}
          </p>
          <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
            Si ripete annualmente in questa data
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:items-center">
          <Link href={`/event-tasks/${event.id}`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={isToggling}
            onClick={onToggleActive}
          >
            {event.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            isDisabled={isDeleting}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
