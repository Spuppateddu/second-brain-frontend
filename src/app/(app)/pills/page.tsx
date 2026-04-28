"use client";

import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  HiCheck,
  HiPencil,
  HiPlus,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import { Input } from "@/components/UI/Input";
import {
  type PillInput,
  useCreatePill,
  useDeletePill,
  usePills,
  useTogglePillActive,
  useUpdatePill,
} from "@/lib/queries/entities";
import type { Pill } from "@/types/entities";

const REMINDER_INTERVAL_OPTIONS = [
  { value: 30, label: "Every 30 seconds" },
  { value: 60, label: "Every 1 minute" },
  { value: 120, label: "Every 2 minutes" },
  { value: 300, label: "Every 5 minutes" },
  { value: 600, label: "Every 10 minutes" },
];

const SHOW_BEFORE_OPTIONS = [
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
];

const EMPTY_FORM: PillFormState = {
  name: "",
  description: "",
  schedule_type: "daily",
  interval_days: 2,
  taking_time: "08:00",
  reminder_interval_seconds: 60,
  show_before_minutes: 60,
  is_active: true,
  start_date: "",
  end_date: "",
};

type PillFormState = {
  name: string;
  description: string;
  schedule_type: "daily" | "daily_interval";
  interval_days: number;
  taking_time: string;
  reminder_interval_seconds: number;
  show_before_minutes: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
};

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

function getStatus(pill: Pill): { label: string; classes: string } {
  if (!pill.is_active) {
    return {
      label: "Inactive",
      classes: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    };
  }
  const today = new Date().toISOString().split("T")[0];
  if (pill.start_date && today < pill.start_date) {
    return {
      label: "Scheduled",
      classes:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    };
  }
  if (pill.end_date && today > pill.end_date) {
    return {
      label: "Expired",
      classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    };
  }
  return {
    label: "Active",
    classes:
      "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  };
}

export default function PillsPage() {
  const { data, isLoading, error } = usePills();
  const create = useCreatePill();
  const update = useUpdatePill;
  const remove = useDeletePill();
  const toggleActive = useTogglePillActive();

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPill, setEditingPill] = useState<Pill | null>(null);
  const [form, setForm] = useState<PillFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMutation = update(editingPill?.id ?? 0);
  const pills = useMemo(() => data ?? [], [data]);

  const sortedPills = useMemo(() => {
    return [...pills].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [pills]);

  const filteredPills = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return sortedPills.filter((p) => p.name.toLowerCase().includes(term));
  }, [sortedPills, searchQuery]);

  function resetForm() {
    setShowForm(false);
    setEditingPill(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function startCreate() {
    setEditingPill(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function startEdit(pill: Pill) {
    setEditingPill(pill);
    setForm({
      name: pill.name,
      description: pill.description ?? "",
      schedule_type: pill.schedule_type,
      interval_days: pill.interval_days ?? 2,
      taking_time: pill.taking_time?.slice(0, 5) ?? "08:00",
      reminder_interval_seconds: pill.reminder_interval_seconds ?? 60,
      show_before_minutes: pill.show_before_minutes ?? 60,
      is_active: pill.is_active,
      start_date: pill.start_date ?? "",
      end_date: pill.end_date ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!form.taking_time) {
      setFormError("Taking time is required");
      return;
    }
    if (
      form.schedule_type === "daily_interval" &&
      (!form.interval_days || form.interval_days < 1)
    ) {
      setFormError("Interval days must be at least 1");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const payload: PillInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      schedule_type: form.schedule_type,
      interval_days:
        form.schedule_type === "daily_interval" ? form.interval_days : null,
      taking_time: form.taking_time.slice(0, 5),
      reminder_interval_seconds: form.reminder_interval_seconds,
      show_before_minutes: form.show_before_minutes,
      is_active: form.is_active,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    try {
      if (editingPill) {
        await updateMutation.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }
      resetForm();
    } catch (err) {
      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string | string[]>;
            };
          };
        }
      )?.response;
      const fieldErrors = response?.data?.errors;
      if (fieldErrors) {
        const first = Object.values(fieldErrors)[0];
        setFormError(Array.isArray(first) ? first[0] : String(first));
      } else {
        setFormError(response?.data?.message ?? "Failed to save pill.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(pill: Pill) {
    if (!confirm(`Delete "${pill.name}"?`)) return;
    await remove.mutateAsync(pill.id);
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pills</h1>
        <Button variant="primary" size="sm" onClick={startCreate}>
          <HiPlus className="mr-1 h-4 w-4" />
          Add Pill
        </Button>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        {showForm ? (
          <PillFormCard
            form={form}
            setForm={setForm}
            editingPill={editingPill}
            isSubmitting={isSubmitting}
            formError={formError}
            onCancel={resetForm}
            onSubmit={handleSubmit}
          />
        ) : null}

        {error ? (
          <p className="text-sm text-danger">
            Couldn&rsquo;t load the pills. Try refreshing.
          </p>
        ) : null}

        {pills.length > 0 ? (
          <Input
            type="text"
            placeholder="Search pills by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
        ) : null}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
        ) : pills.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-lg text-zinc-500 dark:text-zinc-400">
              No pills configured yet.
            </p>
            <Button variant="primary" onClick={startCreate}>
              Add Your First Pill
            </Button>
          </div>
        ) : filteredPills.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">
            No pills found for &ldquo;{searchQuery}&rdquo;
          </p>
        ) : (
          <div className="space-y-4">
            {filteredPills.map((pill) => (
              <PillRow
                key={pill.id}
                pill={pill}
                onEdit={() => startEdit(pill)}
                onToggleActive={() => toggleActive.mutate(pill.id)}
                onDelete={() => handleDelete(pill)}
                isToggling={toggleActive.isPending}
                isDeleting={remove.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PillRow({
  pill,
  onEdit,
  onToggleActive,
  onDelete,
  isToggling,
  isDeleting,
}: {
  pill: Pill;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const status = getStatus(pill);
  const borderClass = pill.is_active
    ? "border-l-purple-500"
    : "border-l-zinc-300 dark:border-l-zinc-700";

  return (
    <div
      className={`rounded-lg border-l-4 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5 ${borderClass}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-base font-semibold sm:text-lg">{pill.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.classes}`}
            >
              {status.label}
            </span>
          </div>
          {pill.description ? (
            <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
              {pill.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              <span className="font-medium">Schedule:</span>{" "}
              {getScheduleDescription(pill)}
            </span>
            <span>
              <span className="font-medium">Time:</span>{" "}
              {formatTime(pill.taking_time)}
            </span>
            <span>
              <span className="font-medium">Reminder:</span>{" "}
              {getReminderText(pill.reminder_interval_seconds)}
            </span>
            <span>
              <span className="font-medium">Period:</span>{" "}
              {getDateRangeText(pill)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:items-center">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <HiPencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={isToggling}
            onClick={onToggleActive}
          >
            {pill.is_active ? "Disable" : "Enable"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            isDisabled={isDeleting}
            onClick={onDelete}
          >
            <HiTrash className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function PillFormCard({
  form,
  setForm,
  editingPill,
  isSubmitting,
  formError,
  onCancel,
  onSubmit,
}: {
  form: PillFormState;
  setForm: (next: PillFormState) => void;
  editingPill: Pill | null;
  isSubmitting: boolean;
  formError: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  function patch<K extends keyof PillFormState>(key: K, value: PillFormState[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-lg font-semibold">
        {editingPill ? "Edit Pill" : "New Pill"}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Name <span className="text-danger">*</span>
          </label>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
            placeholder="e.g., Vitamin D"
            fullWidth
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <Input
            type="text"
            value={form.description}
            onChange={(e) => patch("description", e.target.value)}
            placeholder="Optional notes"
            fullWidth
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Schedule Type <span className="text-danger">*</span>
          </label>
          <select
            value={form.schedule_type}
            onChange={(e) =>
              patch("schedule_type", e.target.value as PillFormState["schedule_type"])
            }
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="daily">Every Day</option>
            <option value="daily_interval">Every X Days</option>
          </select>
        </div>

        {form.schedule_type === "daily_interval" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Interval (days) <span className="text-danger">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={String(form.interval_days)}
              onChange={(e) =>
                patch("interval_days", parseInt(e.target.value, 10) || 1)
              }
              fullWidth
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Taking Time <span className="text-danger">*</span>
            </label>
            <Input
              type="time"
              value={form.taking_time}
              onChange={(e) => patch("taking_time", e.target.value)}
              fullWidth
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Reminder Interval
            </label>
            <select
              value={form.reminder_interval_seconds}
              onChange={(e) =>
                patch("reminder_interval_seconds", parseInt(e.target.value, 10))
              }
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {REMINDER_INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Show in calendar before (minutes)
          </label>
          <select
            value={form.show_before_minutes}
            onChange={(e) =>
              patch("show_before_minutes", parseInt(e.target.value, 10))
            }
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {SHOW_BEFORE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Start Date (optional)
            </label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => patch("start_date", e.target.value)}
              fullWidth
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              End Date (optional)
            </label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => patch("end_date", e.target.value)}
              fullWidth
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => patch("is_active", e.target.checked)}
            className="rounded border-zinc-300 text-primary-600 shadow-sm focus:ring-primary-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          <span>Active</span>
        </label>

        {formError ? (
          <p className="text-sm text-danger">{formError}</p>
        ) : null}

        <div className="flex gap-2 pt-2">
          <Button
            variant="primary"
            onClick={onSubmit}
            isDisabled={isSubmitting}
          >
            <HiCheck className="mr-1 h-4 w-4" />
            {isSubmitting ? "Saving…" : editingPill ? "Update" : "Create"}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            isDisabled={isSubmitting}
          >
            <HiXMark className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
