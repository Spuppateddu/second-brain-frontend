"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

import {
  TaskLinksPanel,
  asLinkedEntitiesPayload,
  collectTaskLinks,
  type LinkedRef,
} from "@/components/TaskLinksPanel";
import {
  useTaskCategories,
  type AutoTaskRuleInput,
} from "@/lib/queries/entities";
import type { AutoTaskRule } from "@/types/entities";

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

const RULE_TYPES: { value: AutoTaskRule["rule_type"]; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly (pick a day of the week)" },
  { value: "monthly_date", label: "Monthly on a specific date" },
  { value: "monthly_interval", label: "Every N months" },
  { value: "daily_interval", label: "Every N days" },
  { value: "yearly", label: "Yearly (pick month + day)" },
];

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function AutoTaskForm({
  initial,
  submitLabel,
  isPending,
  error,
  onCancel,
  onSubmit,
}: {
  initial?: AutoTaskRule;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: AutoTaskRuleInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [ruleType, setRuleType] = useState<AutoTaskRule["rule_type"]>(
    initial?.rule_type ?? "daily",
  );
  const [dayOfWeek, setDayOfWeek] = useState<number>(
    initial?.day_of_week ?? 1,
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    initial?.day_of_month ?? 1,
  );
  const [month, setMonth] = useState<number>(initial?.month ?? 1);
  const [intervalDays, setIntervalDays] = useState<string>(
    String(initial?.interval_days ?? 7),
  );
  const [intervalMonths, setIntervalMonths] = useState<string>(
    String(initial?.interval_months ?? 1),
  );
  const [startTime, setStartTime] = useState(initial?.start_time ?? "");
  const [endTime, setEndTime] = useState(initial?.end_time ?? "");
  const [isWork, setIsWork] = useState(initial?.is_work ?? false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [subTasks, setSubTasks] = useState<string[]>(
    initial?.subTasks?.length
      ? initial.subTasks
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => s.content)
      : [],
  );
  const [linkedRefs, setLinkedRefs] = useState<LinkedRef[]>(() =>
    initial
      ? collectTaskLinks(initial as unknown as Record<string, unknown>)
      : [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    () => initial?.taskCategories?.map((c) => c.id) ?? [],
  );
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");

  const taskCategoriesQuery = useTaskCategories();
  const taskCategories = taskCategoriesQuery.data ?? [];

  const valid = name.trim().length > 0 && content.trim().length > 0;

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function moveSub(i: number, delta: number) {
    const next = i + delta;
    if (next < 0 || next >= subTasks.length) return;
    setSubTasks((s) => {
      const copy = s.slice();
      [copy[i], copy[next]] = [copy[next], copy[i]];
      return copy;
    });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const payload: AutoTaskRuleInput = {
          name: name.trim(),
          content: content.trim(),
          rule_type: ruleType,
          start_time: startTime || null,
          end_time: endTime || null,
          is_work: isWork,
          is_active: isActive,
          day_of_week: ruleType === "weekly" ? dayOfWeek : null,
          day_of_month:
            ruleType === "monthly_date" || ruleType === "yearly"
              ? dayOfMonth
              : null,
          month: ruleType === "yearly" ? month : null,
          interval_days:
            ruleType === "daily_interval" ? Number(intervalDays) : null,
          interval_months:
            ruleType === "monthly_interval" ? Number(intervalMonths) : null,
          sub_tasks: subTasks
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
            .map((c) => ({ content: c })),
          linked_entities: asLinkedEntitiesPayload(linkedRefs),
          task_category_ids: selectedCategoryIds,
          start_date: startDate || null,
          end_date: endDate || null,
        };
        await onSubmit(payload);
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Name <span className="text-danger">*</span>
        </span>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Content <span className="text-danger">*</span>
        </span>
        <textarea
          className="min-h-[80px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Schedule
        </span>
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          value={ruleType}
          onChange={(e) =>
            setRuleType(e.target.value as AutoTaskRule["rule_type"])
          }
        >
          {RULE_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      {ruleType === "weekly" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Day of week
          </span>
          <select
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
          >
            {DAYS_OF_WEEK.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {ruleType === "monthly_date" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Day of month
          </span>
          <Input
            type="number"
            min={1}
            max={31}
            value={String(dayOfMonth)}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
          />
        </label>
      ) : null}
      {ruleType === "monthly_interval" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Every N months
          </span>
          <Input
            type="number"
            min={1}
            value={intervalMonths}
            onChange={(e) => setIntervalMonths(e.target.value)}
          />
        </label>
      ) : null}
      {ruleType === "daily_interval" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Every N days
          </span>
          <Input
            type="number"
            min={1}
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
          />
        </label>
      ) : null}
      {ruleType === "yearly" ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Month
            </span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((label, i) => (
                <option key={i + 1} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Day
            </span>
            <Input
              type="number"
              min={1}
              max={31}
              value={String(dayOfMonth)}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
            />
          </label>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Start time
          </span>
          <Input
            type="time"
            value={startTime ?? ""}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            End time
          </span>
          <Input
            type="time"
            value={endTime ?? ""}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs uppercase tracking-wide text-zinc-500">
          Subtasks (each generated task starts with these)
        </legend>
        {subTasks.map((sub, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 w-6 text-right text-xs text-zinc-500">
              {i + 1}.
            </span>
            <Input
              type="text"
              placeholder="Subtask…"
              value={sub}
              onChange={(e) =>
                setSubTasks((s) =>
                  s.map((v, idx) => (idx === i ? e.target.value : v)),
                )
              }
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="rounded px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                disabled={i === 0}
                onClick={() => moveSub(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                disabled={i === subTasks.length - 1}
                onClick={() => moveSub(i, 1)}
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-danger"
              onClick={() =>
                setSubTasks((s) => s.filter((_, idx) => idx !== i))
              }
            >
              ×
            </button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSubTasks((s) => [...s, ""])}
        >
          + Add subtask
        </Button>
      </fieldset>
      <TaskLinksPanel
        links={linkedRefs}
        isPending={isPending}
        onSave={async (next) => setLinkedRefs(next)}
      />
      {taskCategories.length > 0 ? (
        <fieldset className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <legend className="mb-2 text-sm font-medium">
            Categorie (Opzionale)
          </legend>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Seleziona le categorie da associare ai task generati da questa
            regola.
          </p>
          <div className="flex flex-wrap gap-2">
            {taskCategories.map((category) => {
              const selected = selectedCategoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    selected
                      ? "ring-2 ring-offset-2 ring-primary-500"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: category.color,
                    color: getContrastColor(category.color),
                  }}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <fieldset className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <legend className="mb-2 text-sm font-medium">
          Date Range (Optional)
        </legend>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Leave empty for permanent rule. Set dates to limit when this rule is
          active.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Start Date
            </span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              End Date
            </span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isWork}
            onChange={(e) => setIsWork(e.target.checked)}
          />
          <span>Mark generated tasks as work</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Active</span>
        </label>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isDisabled={!valid || isPending}
        >
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
