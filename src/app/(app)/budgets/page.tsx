"use client";

import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiChartBar,
  HiChevronDown,
  HiPencil,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

import { Input } from "@/components/UI/Input";
import {
  type Budget,
  type BudgetInput,
  type BudgetType,
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useToggleBudgetActive,
  useUpdateBudget,
} from "@/lib/queries/heavy";
import type { PaymentLookup } from "@/types/heavy";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function todayIso() {
  const now = new Date();
  const tz = now.getTimezoneOffset();
  return new Date(now.getTime() - tz * 60000).toISOString().split("T")[0];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BudgetsPage() {
  const { data, isLoading, error } = useBudgets();
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();
  const toggleActive = useToggleBudgetActive();

  const budgets = data?.budgets ?? [];
  const paymentMethods = data?.paymentMethods ?? [];
  const paymentPlatforms = data?.paymentPlatforms ?? [];
  const paymentTypes = data?.paymentTypes ?? [];
  const budgetTypes = useMemo(() => data?.budgetTypes ?? [], [data?.budgetTypes]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const activeCount = budgets.filter((b) => b.is_active).length;

  function startCreate() {
    setEditingBudget(null);
    setFormOpen(true);
  }

  function startEdit(b: Budget) {
    setEditingBudget(b);
    setFormOpen(true);
  }

  async function handleSubmit(payload: BudgetInput) {
    if (editingBudget) {
      await update.mutateAsync({ id: editingBudget.id, payload });
    } else {
      await create.mutateAsync(payload);
    }
    setFormOpen(false);
    setEditingBudget(null);
  }

  async function handleDelete(b: Budget) {
    if (!confirm(`Delete budget "${b.name}"?`)) return;
    await remove.mutateAsync(b.id);
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Budget Management</h1>
      </header>

      {error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the budgets. Try refreshing.
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-5xl space-y-6">
        <CreateBudgetAccordion
          open={formOpen}
          onToggle={() => {
            if (formOpen) {
              setFormOpen(false);
              setEditingBudget(null);
            } else {
              startCreate();
            }
          }}
          editingBudget={editingBudget}
          paymentMethods={paymentMethods}
          paymentPlatforms={paymentPlatforms}
          paymentTypes={paymentTypes}
          budgetTypes={budgetTypes}
          onCancel={() => {
            setFormOpen(false);
            setEditingBudget(null);
          }}
          onSubmit={handleSubmit}
          isPending={create.isPending || update.isPending}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Active Budgets"
            value={activeCount}
            tone="green"
          />
          <StatCard label="Total Budgets" value={budgets.length} tone="zinc" />
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
        ) : budgets.length === 0 ? (
          <div className="py-12 text-center">
            <HiChartBar className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-2 text-base font-semibold">No budgets yet</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Create your first budget to start tracking your spending goals.
            </p>
            <p className="mt-3 text-sm text-primary-600 dark:text-primary-400">
              Use the &ldquo;Create Budget&rdquo; section above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => (
              <BudgetRow
                key={budget.id}
                budget={budget}
                onEdit={() => startEdit(budget)}
                onToggleActive={() => toggleActive.mutate(budget.id)}
                onDelete={() => handleDelete(budget)}
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "zinc";
}) {
  const map = {
    green: {
      bg: "bg-green-50 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-700",
      title: "text-green-800 dark:text-green-300",
      value: "text-green-900 dark:text-green-100",
    },
    zinc: {
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-200 dark:border-zinc-700",
      title: "text-zinc-700 dark:text-zinc-300",
      value: "text-zinc-900 dark:text-zinc-100",
    },
  } as const;
  const c = map[tone];
  return (
    <div className={`rounded-lg border p-4 ${c.bg} ${c.border}`}>
      <p className={`text-sm font-medium ${c.title}`}>{label}</p>
      <p className={`mt-1 text-3xl font-bold ${c.value}`}>{value}</p>
    </div>
  );
}

function CreateBudgetAccordion({
  open,
  onToggle,
  editingBudget,
  paymentMethods,
  paymentPlatforms,
  paymentTypes,
  budgetTypes,
  onCancel,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onToggle: () => void;
  editingBudget: Budget | null;
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  budgetTypes: BudgetType[];
  onCancel: () => void;
  onSubmit: (payload: BudgetInput) => Promise<void>;
  isPending: boolean;
}) {
  const title = editingBudget ? "Edit Budget" : "Create Budget";
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <HiChevronDown
          className={`h-5 w-5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
          <BudgetForm
            key={editingBudget?.id ?? "new"}
            initial={editingBudget}
            paymentMethods={paymentMethods}
            paymentPlatforms={paymentPlatforms}
            paymentTypes={paymentTypes}
            budgetTypes={budgetTypes}
            onCancel={onCancel}
            onSubmit={onSubmit}
            isPending={isPending}
            editing={editingBudget !== null}
          />
        </div>
      ) : null}
    </div>
  );
}

function BudgetForm({
  initial,
  paymentMethods,
  paymentPlatforms,
  paymentTypes,
  budgetTypes,
  onCancel,
  onSubmit,
  isPending,
  editing,
}: {
  initial: Budget | null;
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  budgetTypes: BudgetType[];
  onCancel: () => void;
  onSubmit: (payload: BudgetInput) => Promise<void>;
  isPending: boolean;
  editing: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<BudgetType | "">(initial?.type ?? "");
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : "",
  );
  const [startDate, setStartDate] = useState(
    initial?.start_date?.split("T")[0] ?? todayIso(),
  );
  const [endDate, setEndDate] = useState(
    initial?.end_date?.split("T")[0] ?? "",
  );
  const [includeSubs, setIncludeSubs] = useState(
    initial?.include_subscription_payments ?? true,
  );
  const [methodIds, setMethodIds] = useState<number[]>(
    initial?.paymentMethods?.map((m) => m.id) ?? [],
  );
  const [platformIds, setPlatformIds] = useState<number[]>(
    initial?.paymentPlatforms?.map((p) => p.id) ?? [],
  );
  const [typeIds, setTypeIds] = useState<number[]>(
    initial?.paymentTypes?.map((t) => t.id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Budget name is required.");
      return;
    }
    if (!type) {
      setError("Select a budget type.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        type: type as BudgetType,
        amount: Number(amount),
        start_date: startDate,
        end_date: endDate || null,
        include_subscription_payments: includeSubs,
        payment_method_ids: methodIds,
        payment_platform_ids: platformIds,
        payment_type_ids: typeIds,
      });
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
        setError(Array.isArray(first) ? first[0] : String(first));
      } else {
        setError(response?.data?.message ?? "Failed to save.");
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Budget Name</label>
        <Input
          type="text"
          placeholder="e.g., Monthly Grocery Budget"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Description (Optional)
        </label>
        <textarea
          placeholder="Brief description of this budget..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Budget Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BudgetType | "")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Select budget type</option>
            {budgetTypes.map((t) => (
              <option key={t} value={t}>
                {BUDGET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Budget Amount</label>
          <Input
            type="number"
            step="0.01"
            min={0}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            End Date (Optional)
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            If left empty, the end date will be set to 20 years from the start
            date
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeSubs}
            onChange={(e) => setIncludeSubs(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Include subscription payments in budget calculations
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              When checked, recurring subscription payments will count towards
              this budget limit. Uncheck to exclude subscriptions from budget
              tracking.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Payment Methods (Optional)
        </label>
        <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
          Select payment methods this budget applies to. Leave empty to apply
          to all methods.
        </p>
        <BudgetMultiSelect
          options={paymentMethods}
          value={methodIds}
          onChange={setMethodIds}
          placeholder="Select payment methods"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Payment Platforms (Optional)
        </label>
        <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
          Select payment platforms this budget applies to. Leave empty to
          apply to all platforms.
        </p>
        <BudgetMultiSelect
          options={paymentPlatforms}
          value={platformIds}
          onChange={setPlatformIds}
          placeholder="Select payment platforms"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Payment Types (Optional)
        </label>
        <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
          Select payment types this budget applies to. Leave empty to apply to
          all types.
        </p>
        <BudgetMultiSelect
          options={paymentTypes}
          value={typeIds}
          onChange={setTypeIds}
          placeholder="Select payment types"
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Button
          variant="secondary"
          onClick={onCancel}
          isDisabled={isPending}
        >
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} isDisabled={isPending}>
          {isPending
            ? "Saving…"
            : editing
              ? "Update Budget"
              : "Create Budget"}
        </Button>
      </div>
    </div>
  );
}

function BudgetMultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: PaymentLookup[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function toggle(id: number) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  const label =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? options
            .filter((o) => value.includes(o.id))
            .map((o) => o.name)
            .join(", ")
        : `${value.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <span
          className={
            value.length === 0
              ? "text-zinc-400 dark:text-zinc-500"
              : "truncate"
          }
        >
          {label}
        </span>
        <HiChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">No options.</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.id)}
                  onChange={() => toggle(opt.id)}
                />
                {opt.name}
              </label>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function BudgetRow({
  budget,
  onEdit,
  onToggleActive,
  onDelete,
  isToggling,
  isDeleting,
}: {
  budget: Budget;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const borderClass = budget.is_active
    ? "border-l-success-500"
    : "border-l-zinc-300 dark:border-l-zinc-700";

  return (
    <div
      className={`rounded-lg border-l-4 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5 ${borderClass}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base font-semibold sm:text-lg">{budget.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                budget.is_active
                  ? "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {budget.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          {budget.description ? (
            <p className="mb-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {budget.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              <span className="font-medium">Type:</span>{" "}
              {BUDGET_TYPE_LABELS[budget.type]}
            </span>
            <span>
              <span className="font-medium">Amount:</span>{" "}
              {CURRENCY.format(Number(budget.amount))}
            </span>
            <span>
              <span className="font-medium">From:</span>{" "}
              {formatDate(budget.start_date)}
            </span>
            <span>
              <span className="font-medium">To:</span>{" "}
              {formatDate(budget.end_date)}
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
            {budget.is_active ? "Deactivate" : "Activate"}
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
