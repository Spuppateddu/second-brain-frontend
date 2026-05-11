"use client";

import { useState } from "react";
import {
  HiChevronDown,
  HiChevronUp,
  HiPlus,
  HiXMark,
} from "react-icons/hi2";

import {
  TaskLinksPanel,
  asLinkedEntitiesPayload,
  collectTaskLinks,
  type LinkedRef,
} from "@/components/TaskLinksPanel";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
import { Textarea } from "@/components/UI/Textarea";
import { Wizard, type WizardStep } from "@/components/UI/Wizard";
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

export function AutoTaskWizard({
  initial,
  submitLabel,
  isPending,
  error,
  onSubmit,
}: {
  initial?: AutoTaskRule;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (input: AutoTaskRuleInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [ruleType, setRuleType] = useState<AutoTaskRule["rule_type"]>(
    initial?.rule_type ?? "daily",
  );
  const [dayOfWeek, setDayOfWeek] = useState<number>(initial?.day_of_week ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(initial?.day_of_month ?? 1);
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

  const basicsValid = name.trim().length > 0 && content.trim().length > 0;

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function moveSub(i: number, delta: number) {
    const target = i + delta;
    if (target < 0 || target >= subTasks.length) return;
    setSubTasks((s) => {
      const copy = s.slice();
      [copy[i], copy[target]] = [copy[target], copy[i]];
      return copy;
    });
  }

  async function handleSubmit() {
    if (!basicsValid) return;
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
        ruleType === "monthly_date" || ruleType === "yearly" ? dayOfMonth : null,
      month: ruleType === "yearly" ? month : null,
      interval_days: ruleType === "daily_interval" ? Number(intervalDays) : null,
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
  }

  const steps: WizardStep[] = [
    {
      id: "basics",
      title: "Basics",
      description: "What this rule is and what task it generates.",
      canAdvance: basicsValid,
      content: (
        <>
          <Input
            label="Name *"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            fullWidth
          />
          <Textarea
            label="Content *"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            fullWidth
          />
          <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500/30 dark:border-secondary-700 dark:bg-secondary-950"
              checked={isWork}
              onChange={(e) => setIsWork(e.target.checked)}
            />
            <span>Mark generated tasks as work</span>
          </label>
        </>
      ),
    },
    {
      id: "schedule",
      title: "Schedule",
      description: "When the task should be generated.",
      content: (
        <>
          <Select
            label="Type"
            value={ruleType}
            onChange={(e) =>
              setRuleType(e.target.value as AutoTaskRule["rule_type"])
            }
            fullWidth
          >
            {RULE_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          {ruleType === "weekly" ? (
            <Select
              label="Day of week"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              fullWidth
            >
              {DAYS_OF_WEEK.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </Select>
          ) : null}
          {ruleType === "monthly_date" ? (
            <Input
              label="Day of month"
              type="number"
              min={1}
              max={31}
              value={String(dayOfMonth)}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
              fullWidth
            />
          ) : null}
          {ruleType === "monthly_interval" ? (
            <Input
              label="Every N months"
              type="number"
              min={1}
              value={intervalMonths}
              onChange={(e) => setIntervalMonths(e.target.value)}
              fullWidth
            />
          ) : null}
          {ruleType === "daily_interval" ? (
            <Input
              label="Every N days"
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              fullWidth
            />
          ) : null}
          {ruleType === "yearly" ? (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                fullWidth
              >
                {MONTHS.map((label, i) => (
                  <option key={i + 1} value={i + 1}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input
                label="Day"
                type="number"
                min={1}
                max={31}
                value={String(dayOfMonth)}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                fullWidth
              />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              type="time"
              value={startTime ?? ""}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
            />
            <Input
              label="End time"
              type="time"
              value={endTime ?? ""}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
            />
          </div>
        </>
      ),
    },
    {
      id: "subtasks",
      title: "Subtasks",
      description: "Each generated task starts with these. Optional.",
      content: (
        <>
          <div className="flex justify-end">
            <IconButton
              type="button"
              size="sm"
              variant="secondary"
              label="Add subtask"
              onClick={() => setSubTasks((s) => [...s, ""])}
            >
              <HiPlus />
            </IconButton>
          </div>
          {subTasks.length === 0 ? (
            <p className="text-sm text-secondary-500">No subtasks yet.</p>
          ) : (
            subTasks.map((sub, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 w-6 shrink-0 text-right text-xs text-secondary-500">
                  {i + 1}.
                </span>
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Subtask…"
                    value={sub}
                    onChange={(e) =>
                      setSubTasks((s) =>
                        s.map((v, idx) => (idx === i ? e.target.value : v)),
                      )
                    }
                    fullWidth
                  />
                </div>
                <div className="flex shrink-0 flex-col">
                  <IconButton
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={i === 0}
                    onClick={() => moveSub(i, -1)}
                    label="Move up"
                  >
                    <HiChevronUp />
                  </IconButton>
                  <IconButton
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={i === subTasks.length - 1}
                    onClick={() => moveSub(i, 1)}
                    label="Move down"
                  >
                    <HiChevronDown />
                  </IconButton>
                </div>
                <IconButton
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    setSubTasks((s) => s.filter((_, idx) => idx !== i))
                  }
                  label="Remove subtask"
                >
                  <HiXMark />
                </IconButton>
              </div>
            ))
          )}
        </>
      ),
    },
    {
      id: "links",
      title: "Categories & links",
      description: "Optional tagging and references to other entities.",
      content: (
        <>
          {taskCategories.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Categories
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
                          ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-secondary-950"
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
            </div>
          ) : null}
          <TaskLinksPanel
            links={linkedRefs}
            isPending={isPending}
            onSave={async (next) => setLinkedRefs(next)}
          />
        </>
      ),
    },
    {
      id: "advanced",
      title: "Advanced",
      description:
        "Date range and active state. Leave dates empty for a permanent rule.",
      content: (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500/30 dark:border-secondary-700 dark:bg-secondary-950"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Active</span>
          </label>
          <div className="rounded-[var(--radius-control)] border border-secondary-200 bg-secondary-50 p-3 text-sm text-secondary-700 dark:border-secondary-800 dark:bg-secondary-900 dark:text-secondary-300">
            <p className="font-medium">Ready to save</p>
            <p className="mt-1 text-xs text-secondary-500">
              Submitting will create the rule and return you to the list.
            </p>
          </div>
        </>
      ),
    },
  ];

  return (
    <Wizard
      steps={steps}
      onComplete={handleSubmit}
      isSubmitting={isPending}
      submitLabel={submitLabel}
      error={error}
    />
  );
}
