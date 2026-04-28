"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  classes: string;
} {
  if (!rule.is_active) {
    return {
      label: "Inactive",
      classes: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    };
  }
  const today = new Date().toISOString().split("T")[0];
  if (rule.start_date && today < rule.start_date) {
    return {
      label: "Scheduled",
      classes:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    };
  }
  if (rule.end_date && today > rule.end_date) {
    return {
      label: "Expired",
      classes:
        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    };
  }
  return {
    label: "Active",
    classes:
      "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  };
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
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Auto Tasks</h1>
        <Link href="/auto-tasks/new">
          <Button variant="primary" size="sm">
            Add New Rule
          </Button>
        </Link>
      </header>

      {error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the auto tasks. Try refreshing.
        </p>
      ) : (
        <div className="mx-auto w-full max-w-7xl space-y-6">
          {rules.length > 0 ? (
            <Input
              type="text"
              placeholder="Search rules by name or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          ) : null}

          {isLoading ? (
            <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
          ) : rules.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-lg text-zinc-500 dark:text-zinc-400">
                No auto task rules configured yet.
              </p>
              <Link href="/auto-tasks/new">
                <Button variant="primary">Create Your First Rule</Button>
              </Link>
            </div>
          ) : filteredRules.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">
              No rules found for &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            <div className="space-y-4">
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
  const borderClass = rule.is_active
    ? rule.is_work
      ? "border-l-warning-500"
      : "border-l-success-500"
    : "border-l-zinc-300 dark:border-l-zinc-700";

  return (
    <div
      className={`rounded-lg border-l-4 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5 ${borderClass}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-base font-semibold sm:text-lg">{rule.name}</h3>
            <div className="flex shrink-0 gap-1">
              {rule.is_work ? (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Work
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.classes}`}
              >
                {status.label}
              </span>
            </div>
          </div>

          <p className="mb-2 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
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

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="font-medium">
                {RULE_TYPE_LABELS[rule.rule_type]}:
              </span>{" "}
              {getRuleDescription(rule)}
              {rule.start_time ? (
                <span className="text-zinc-500">
                  {" "}
                  {rule.start_time}
                  {rule.end_time ? ` – ${rule.end_time}` : null}
                </span>
              ) : null}
            </div>
            <div>
              <span className="font-medium">Period:</span>{" "}
              {getDateRangeText(rule)}
            </div>
            <div>
              <span className="font-medium">Last executed:</span>{" "}
              {rule.last_execution ? formatDate(rule.last_execution) : "Never"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:items-center">
          <Link href={`/auto-tasks/${rule.id}`}>
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
            {rule.is_active ? "Deactivate" : "Activate"}
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
