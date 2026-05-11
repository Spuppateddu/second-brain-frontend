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
  useAutoTasks,
  useDeleteAutoTaskRule,
  useToggleAutoTaskActive,
} from "@/lib/queries/entities";
import type { AutoTaskRule } from "@/types/entities";

const RULE_TYPE_LABELS: Record<AutoTaskRule["rule_type"], string> = {
  daily: "Every Day",
  weekly: "Weekly",
  monthly_date: "Monthly (Specific Date)",
  monthly_interval: "Every X Months",
  daily_interval: "Every X Days",
  yearly: "Yearly",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRuleDescription(rule: AutoTaskRule): string {
  switch (rule.rule_type) {
    case "daily":
      return "Every day";
    case "weekly":
      return `Every ${DAY_NAMES[rule.day_of_week ?? 0]}`;
    case "monthly_date":
      return `Every ${rule.day_of_month}th of the month`;
    case "monthly_interval":
      return `Every ${rule.interval_months} month${rule.interval_months === 1 ? "" : "s"}`;
    case "daily_interval":
      return `Every ${rule.interval_days} day${rule.interval_days === 1 ? "" : "s"}`;
    case "yearly":
      return `Every ${MONTH_NAMES[(rule.month ?? 1) - 1]} ${rule.day_of_month}`;
    default:
      return rule.rule_type;
  }
}

function getDateRangeText(rule: AutoTaskRule): string {
  if (!rule.start_date && !rule.end_date) return "Permanent";
  if (rule.start_date && rule.end_date) {
    return `${formatDate(rule.start_date)} - ${formatDate(rule.end_date)}`;
  }
  if (rule.start_date) return `From ${formatDate(rule.start_date)}`;
  if (rule.end_date) return `Until ${formatDate(rule.end_date)}`;
  return "Permanent";
}

function getRuleStatus(rule: AutoTaskRule): {
  label: string;
  variant: BadgeVariant;
} {
  if (!rule.is_active) {
    return { label: "Inactive", variant: "neutral" };
  }
  const today = new Date().toISOString().split("T")[0];
  if (rule.start_date && today < rule.start_date) {
    return { label: "Scheduled", variant: "info" };
  }
  if (rule.end_date && today > rule.end_date) {
    return { label: "Expired", variant: "danger" };
  }
  return { label: "Active", variant: "success" };
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export default function AutoTasksPage() {
  const { data, isLoading, error } = useAutoTasks();
  const toggleActive = useToggleAutoTaskActive();
  const remove = useDeleteAutoTaskRule();

  const [searchQuery, setSearchQuery] = useState("");

  const rules = useMemo(() => data ?? [], [data]);

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      if (a.is_work !== b.is_work) return a.is_work ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [rules]);

  const filteredRules = useMemo(() => {
    const term = searchQuery.toLowerCase();
    if (!term) return sortedRules;
    return sortedRules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(term) ||
        rule.content.toLowerCase().includes(term),
    );
  }, [sortedRules, searchQuery]);

  const handleDelete = async (rule: AutoTaskRule) => {
    if (!confirm("Are you sure you want to delete this auto task rule?")) return;
    await remove.mutateAsync(rule.id);
  };

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Auto Tasks
          </h1>
          <Link href="/auto-tasks/new" aria-label="New rule">
            <IconButton variant="primary" size="sm" label="New rule">
              <HiPlus />
            </IconButton>
          </Link>
        </header>

        {error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            Couldn&rsquo;t load the auto tasks. Try refreshing.
          </p>
        ) : (
          <div className="space-y-4">
            {rules.length > 0 ? (
              <Input
                type="text"
                placeholder="Search rules by name or content…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            ) : null}

            {isLoading ? (
              <p className="py-12 text-center text-sm text-secondary-500">
                Loading…
              </p>
            ) : rules.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-12 text-center shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
                <p className="mb-4 text-base text-secondary-600 dark:text-secondary-400">
                  No auto task rules configured yet.
                </p>
                <Link href="/auto-tasks/new" aria-label="Create your first rule">
                  <IconButton variant="primary" size="lg" label="Create your first rule">
                    <HiPlus />
                  </IconButton>
                </Link>
              </div>
            ) : filteredRules.length === 0 ? (
              <p className="py-12 text-center text-secondary-500">
                No rules found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <div className="space-y-3">
                {filteredRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggleActive={() => toggleActive.mutate(rule.id)}
                    onDelete={() => handleDelete(rule)}
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

function RuleCard({
  rule,
  onToggleActive,
  onDelete,
  isToggling,
  isDeleting,
}: {
  rule: AutoTaskRule;
  onToggleActive: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const status = getRuleStatus(rule);

  return (
    <article className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 sm:text-lg">
              {rule.name}
            </h3>
            <Badge variant={status.variant}>{status.label}</Badge>
            {rule.is_work ? <Badge variant="accent">Work</Badge> : null}
          </div>

          <p className="mb-2 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
            {rule.content}
          </p>

          {(rule.taskCategories?.length ?? 0) > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {rule.taskCategories?.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: category.color,
                    color: getContrastColor(category.color),
                  }}
                >
                  {category.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-secondary-600 dark:text-secondary-400">
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">
                {RULE_TYPE_LABELS[rule.rule_type]}:
              </span>{" "}
              {getRuleDescription(rule)}
              {rule.start_time ? (
                <span className="text-secondary-500">
                  {" "}
                  {rule.start_time}
                  {rule.end_time ? ` – ${rule.end_time}` : null}
                </span>
              ) : null}
            </div>
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">
                Period:
              </span>{" "}
              {getDateRangeText(rule)}
            </div>
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">
                Last executed:
              </span>{" "}
              {rule.last_execution ? formatDate(rule.last_execution) : "Never"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:shrink-0">
          <Link href={`/auto-tasks/${rule.id}`} aria-label="Edit">
            <IconButton size="sm" variant="secondary" label="Edit">
              <HiPencilSquare />
            </IconButton>
          </Link>
          <IconButton
            size="sm"
            variant="secondary"
            disabled={isToggling}
            onClick={onToggleActive}
            label={rule.is_active ? "Deactivate" : "Activate"}
          >
            {rule.is_active ? <HiPauseCircle /> : <HiPlayCircle />}
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
