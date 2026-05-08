"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiPauseCircle,
  HiPencilSquare,
  HiPlayCircle,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

import { Badge, type BadgeVariant } from "@/components/UI/Badge";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import {
  useDeletePill,
  usePills,
  useTogglePillActive,
} from "@/lib/queries/entities";
import type { Pill } from "@/types/entities";

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getScheduleDescription(pill: Pill): string {
  if (pill.schedule_type === "daily") return "Every day";
  if (pill.schedule_type === "daily_interval") {
    if (pill.interval_days === 1) return "Every day";
    return `Every ${pill.interval_days} days`;
  }
  return pill.schedule_type;
}

function getReminderText(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function getDateRangeText(pill: Pill): string {
  if (!pill.start_date && !pill.end_date) return "Permanent";
  if (pill.start_date && pill.end_date) {
    return `${formatDate(pill.start_date)} - ${formatDate(pill.end_date)}`;
  }
  if (pill.start_date) return `From ${formatDate(pill.start_date)}`;
  if (pill.end_date) return `Until ${formatDate(pill.end_date)}`;
  return "Permanent";
}

function getStatus(pill: Pill): { label: string; variant: BadgeVariant } {
  if (!pill.is_active) {
    return { label: "Inactive", variant: "neutral" };
  }
  const today = new Date().toISOString().split("T")[0];
  if (pill.start_date && today < pill.start_date) {
    return { label: "Scheduled", variant: "info" };
  }
  if (pill.end_date && today > pill.end_date) {
    return { label: "Expired", variant: "danger" };
  }
  return { label: "Active", variant: "success" };
}

export default function PillsPage() {
  const { data, isLoading, error } = usePills();
  const remove = useDeletePill();
  const toggleActive = useTogglePillActive();
  const [searchQuery, setSearchQuery] = useState("");

  const pills = useMemo(() => data ?? [], [data]);

  const sortedPills = useMemo(() => {
    return [...pills].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [pills]);

  const filteredPills = useMemo(() => {
    const term = searchQuery.toLowerCase();
    if (!term) return sortedPills;
    return sortedPills.filter((p) => p.name.toLowerCase().includes(term));
  }, [sortedPills, searchQuery]);

  const handleDelete = async (pill: Pill) => {
    if (!confirm(`Delete "${pill.name}"?`)) return;
    await remove.mutateAsync(pill.id);
  };

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Pills
          </h1>
          <Link href="/pills/new" aria-label="New pill">
            <IconButton variant="primary" size="sm" label="New pill">
              <HiPlus />
            </IconButton>
          </Link>
        </header>

        {error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            Couldn&rsquo;t load the pills. Try refreshing.
          </p>
        ) : (
          <div className="space-y-4">
            {pills.length > 0 ? (
              <Input
                type="text"
                placeholder="Search pills by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            ) : null}

            {isLoading ? (
              <p className="py-12 text-center text-sm text-secondary-500">
                Loading…
              </p>
            ) : pills.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-12 text-center shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
                <p className="mb-4 text-base text-secondary-600 dark:text-secondary-400">
                  No pills configured yet.
                </p>
                <Link href="/pills/new" aria-label="Add your first pill">
                  <IconButton
                    variant="primary"
                    size="lg"
                    label="Add your first pill"
                  >
                    <HiPlus />
                  </IconButton>
                </Link>
              </div>
            ) : filteredPills.length === 0 ? (
              <p className="py-12 text-center text-secondary-500">
                No pills found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPills.map((pill) => (
                  <PillRow
                    key={pill.id}
                    pill={pill}
                    onToggleActive={() => toggleActive.mutate(pill.id)}
                    onDelete={() => handleDelete(pill)}
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

function PillRow({
  pill,
  onToggleActive,
  onDelete,
  isToggling,
  isDeleting,
}: {
  pill: Pill;
  onToggleActive: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const status = getStatus(pill);

  return (
    <article className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 sm:text-lg">
              {pill.name}
            </h3>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          {pill.description ? (
            <p className="mb-2 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
              {pill.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-secondary-600 dark:text-secondary-400">
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">
                Schedule:
              </span>{" "}
              {getScheduleDescription(pill)}
            </div>
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">
                Time:
              </span>{" "}
              {formatTime(pill.taking_time)}
            </div>
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">
                Reminder:
              </span>{" "}
              {getReminderText(pill.reminder_interval_seconds)}
            </div>
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">
                Period:
              </span>{" "}
              {getDateRangeText(pill)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:shrink-0">
          <Link href={`/pills/${pill.id}`} aria-label="Edit">
            <IconButton size="sm" variant="secondary" label="Edit">
              <HiPencilSquare />
            </IconButton>
          </Link>
          <IconButton
            size="sm"
            variant="secondary"
            disabled={isToggling}
            onClick={onToggleActive}
            label={pill.is_active ? "Deactivate" : "Activate"}
          >
            {pill.is_active ? <HiPauseCircle /> : <HiPlayCircle />}
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
