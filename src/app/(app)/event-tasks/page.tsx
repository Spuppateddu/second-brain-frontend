"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiPauseCircle,
  HiPencilSquare,
  HiPlayCircle,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

import { Badge } from "@/components/UI/Badge";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
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
  const remove = useDeleteEventTask();
  const [searchQuery, setSearchQuery] = useState("");

  const toggleActive = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/event-tasks/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.eventTasks });
    },
  });

  const events = useMemo(() => data ?? [], [data]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      return a.name.localeCompare(b.name);
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    const term = searchQuery.toLowerCase();
    if (!term) return sortedEvents;
    return sortedEvents.filter((event) =>
      event.name.toLowerCase().includes(term),
    );
  }, [sortedEvents, searchQuery]);

  const handleDelete = async (event: EventTask) => {
    if (!confirm("Delete this event task?")) return;
    await remove.mutateAsync(event.id);
  };

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Event Tasks
          </h1>
          <Link href="/event-tasks/new" aria-label="New event">
            <IconButton variant="primary" size="sm" label="New event">
              <HiPlus />
            </IconButton>
          </Link>
        </header>

        {error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            Couldn&rsquo;t load the event tasks. Try refreshing.
          </p>
        ) : (
          <div className="space-y-4">
            {events.length > 0 ? (
              <Input
                type="text"
                placeholder="Search events by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            ) : null}

            {isLoading ? (
              <p className="py-12 text-center text-sm text-secondary-500">
                Loading…
              </p>
            ) : events.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-12 text-center shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
                <p className="mb-4 text-base text-secondary-600 dark:text-secondary-400">
                  No event tasks configured yet.
                </p>
                <Link
                  href="/event-tasks/new"
                  aria-label="Create your first event"
                >
                  <IconButton
                    variant="primary"
                    size="lg"
                    label="Create your first event"
                  >
                    <HiPlus />
                  </IconButton>
                </Link>
              </div>
            ) : filteredEvents.length === 0 ? (
              <p className="py-12 text-center text-secondary-500">
                No events found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onToggleActive={() => toggleActive.mutate(event.id)}
                    onDelete={() => handleDelete(event)}
                    isToggling={toggleActive.isPending}
                    isDeleting={remove.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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
    <article className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 sm:text-lg">
              {event.name}
            </h3>
            <Badge variant={event.is_active ? "success" : "neutral"}>
              {event.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <p className="mb-1 text-sm font-medium text-primary-600 dark:text-primary-400">
            {SHORT_MONTHS[event.month - 1]} {event.day}
          </p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            Repeats yearly on this date.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:shrink-0">
          <Link href={`/event-tasks/${event.id}`} aria-label="Edit">
            <IconButton size="sm" variant="secondary" label="Edit">
              <HiPencilSquare />
            </IconButton>
          </Link>
          <IconButton
            size="sm"
            variant="secondary"
            disabled={isToggling}
            onClick={onToggleActive}
            label={event.is_active ? "Deactivate" : "Activate"}
          >
            {event.is_active ? <HiPauseCircle /> : <HiPlayCircle />}
          </IconButton>
          <IconButton
            size="sm"
            variant="danger"
            disabled={isDeleting}
            onClick={onDelete}
            label="Delete"
          >
            <HiTrash />
          </IconButton>
        </div>
      </div>
    </article>
  );
}
