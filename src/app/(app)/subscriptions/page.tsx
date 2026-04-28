"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import {
  HiChevronDown,
  HiPause,
  HiPencilSquare,
  HiPlay,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

import { Input } from "@/components/UI/Input";
import {
  type Subscription,
  type SubscriptionFrequency,
  type SubscriptionInput,
  useCreateSubscription,
  useDeleteSubscription,
  useGenerateSubscriptionPayments,
  useSubscriptions,
  useToggleSubscriptionActive,
  useUpdateSubscription,
} from "@/lib/queries/heavy";
import type { PaymentLookup } from "@/types/heavy";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const FREQUENCY_LABEL: Record<SubscriptionFrequency, string> = {
  monthly: "Monthly",
  "3_months": "Quarterly",
  "6_months": "Semi-annual",
  annual: "Annual",
};

function todayIso() {
  const now = new Date();
  const tz = now.getTimezoneOffset();
  return new Date(now.getTime() - tz * 60000).toISOString().split("T")[0];
}

function formatLongDate(iso: string | null): string {
  if (!iso) return "Ongoing";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SubscriptionsPage() {
  const { data, isLoading, error } = useSubscriptions();
  const create = useCreateSubscription();
  const update = useUpdateSubscription();
  const remove = useDeleteSubscription();
  const toggleActive = useToggleSubscriptionActive();
  const generatePayments = useGenerateSubscriptionPayments();

  const subscriptions = data?.subscriptions ?? [];
  const paymentMethods = data?.paymentMethods ?? [];
  const paymentPlatforms = data?.paymentPlatforms ?? [];
  const paymentTypes = data?.paymentTypes ?? [];

  const activeCount = subscriptions.filter((s) => s.is_active).length;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [genMessage, setGenMessage] = useState<{
    text: string;
    tone: "success" | "error";
  } | null>(null);

  function startCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function startEdit(s: Subscription) {
    setEditing(s);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(payload: SubscriptionInput) {
    if (editing) {
      await update.mutateAsync({ id: editing.id, payload });
    } else {
      await create.mutateAsync(payload);
    }
    closeForm();
  }

  async function handleDelete(s: Subscription) {
    if (!confirm(`Delete subscription "${s.name}"?`)) return;
    await remove.mutateAsync(s.id);
  }

  async function handleGenerate() {
    setGenMessage(null);
    try {
      const res = await generatePayments.mutateAsync();
      if (res.error) {
        setGenMessage({ text: res.error, tone: "error" });
      } else {
        setGenMessage({
          text: res.success ?? "Payments generated.",
          tone: "success",
        });
      }
    } catch {
      setGenMessage({
        text: "Failed to generate subscription payments.",
        tone: "error",
      });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Subscription Management</h1>
      </header>

      {error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the subscriptions. Try refreshing.
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-7xl space-y-6">
        <CreateSubscriptionAccordion
          open={formOpen}
          onToggle={() => (formOpen ? closeForm() : startCreate())}
          editing={editing}
          paymentMethods={paymentMethods}
          paymentPlatforms={paymentPlatforms}
          paymentTypes={paymentTypes}
          onCancel={closeForm}
          onSubmit={handleSubmit}
          isPending={create.isPending || update.isPending}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Active Subscriptions" value={activeCount} tone="green" />
          <StatCard
            label="Total Subscriptions"
            value={subscriptions.length}
            tone="zinc"
          />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">
                Generate Monthly Payments
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create payment entries for active subscriptions for the current
                month (future/present dates only).
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleGenerate}
              isDisabled={generatePayments.isPending}
            >
              {generatePayments.isPending
                ? "Generating…"
                : "Generate Payments"}
            </Button>
          </div>
          {genMessage ? (
            <p
              className={`mt-3 text-sm ${
                genMessage.tone === "success"
                  ? "text-success-600 dark:text-success-400"
                  : "text-danger"
              }`}
            >
              {genMessage.text}
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
        ) : subscriptions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-lg text-zinc-500 dark:text-zinc-400">
              No subscriptions configured yet.
            </p>
            <Button variant="primary" onClick={startCreate}>
              Create Your First Subscription
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold">
              Active Subscriptions ({activeCount})
            </h2>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Currently active subscription tracking
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onEdit={() => startEdit(sub)}
                  onToggleActive={() => toggleActive.mutate(sub.id)}
                  onDelete={() => handleDelete(sub)}
                  isToggling={toggleActive.isPending}
                  isDeleting={remove.isPending}
                />
              ))}
            </div>
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

function CreateSubscriptionAccordion({
  open,
  onToggle,
  editing,
  paymentMethods,
  paymentPlatforms,
  paymentTypes,
  onCancel,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onToggle: () => void;
  editing: Subscription | null;
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  onCancel: () => void;
  onSubmit: (payload: SubscriptionInput) => Promise<void>;
  isPending: boolean;
}) {
  const title = editing ? "Edit Subscription" : "Create Subscription";
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
          <SubscriptionForm
            key={editing?.id ?? "new"}
            initial={editing}
            paymentMethods={paymentMethods}
            paymentPlatforms={paymentPlatforms}
            paymentTypes={paymentTypes}
            onCancel={onCancel}
            onSubmit={onSubmit}
            isPending={isPending}
            editing={editing !== null}
          />
        </div>
      ) : null}
    </div>
  );
}

function SubscriptionForm({
  initial,
  paymentMethods,
  paymentPlatforms,
  paymentTypes,
  onCancel,
  onSubmit,
  isPending,
  editing,
}: {
  initial: Subscription | null;
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  onCancel: () => void;
  onSubmit: (payload: SubscriptionInput) => Promise<void>;
  isPending: boolean;
  editing: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : "",
  );
  const [startDate, setStartDate] = useState(
    initial?.start_date?.split("T")[0] ?? todayIso(),
  );
  const [endDate, setEndDate] = useState(
    initial?.end_date?.split("T")[0] ?? "",
  );
  const [paymentDay, setPaymentDay] = useState<number>(
    initial?.payment_day ?? 1,
  );
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(
    initial?.payment_frequency ?? "monthly",
  );
  const [methodId, setMethodId] = useState<number | null>(
    initial?.payment_method_id ?? null,
  );
  const [platformId, setPlatformId] = useState<number | null>(
    initial?.payment_platform_id ?? null,
  );
  const [typeIds, setTypeIds] = useState<number[]>(
    initial?.paymentTypes?.map((t) => t.id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Subscription name is required.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (methodId === null) {
      setError("Select a payment method.");
      return;
    }
    if (platformId === null) {
      setError("Select a payment platform.");
      return;
    }
    if (typeIds.length === 0) {
      setError("Select at least one payment type.");
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        amount: Number(amount),
        start_date: startDate,
        end_date: endDate || null,
        payment_day: paymentDay,
        payment_frequency: frequency,
        payment_method_id: methodId,
        payment_platform_id: platformId,
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
        <label className="mb-1 block text-sm font-medium">
          Subscription Name
        </label>
        <Input
          type="text"
          placeholder="e.g., Netflix Premium"
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
          placeholder="Brief description of this subscription..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Subscription Amount
        </label>
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
            Leave empty for ongoing subscription
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Payment Day</label>
          <select
            value={paymentDay}
            onChange={(e) => setPaymentDay(Number(e.target.value))}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Day of the month for payment
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Payment Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) =>
              setFrequency(e.target.value as SubscriptionFrequency)
            }
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="monthly">Monthly</option>
            <option value="3_months">Every 3 months</option>
            <option value="6_months">Every 6 months</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Payment Method</label>
        <SelectLookup
          options={paymentMethods}
          value={methodId}
          onChange={setMethodId}
          placeholder="Select payment method"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Payment Platform
        </label>
        <SelectLookup
          options={paymentPlatforms}
          value={platformId}
          onChange={setPlatformId}
          placeholder="Select payment platform"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Payment Types</label>
        <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
          Select at least one payment type for this subscription.
        </p>
        <MultiSelectDropdown
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
              ? "Update Subscription"
              : "Create Subscription"}
        </Button>
      </div>
    </div>
  );
}

function SelectLookup({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: PaymentLookup[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value === null ? "" : String(value)}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  );
}

function MultiSelectDropdown({
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

function SubscriptionCard({
  subscription,
  onEdit,
  onToggleActive,
  onDelete,
  isToggling,
  isDeleting,
}: {
  subscription: Subscription;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const periodText = `${formatLongDate(subscription.start_date)} - ${formatLongDate(subscription.end_date)}`;
  const paymentText = `Day ${subscription.payment_day} - ${FREQUENCY_LABEL[subscription.payment_frequency]}`;

  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold">
                {subscription.name}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  subscription.is_active
                    ? "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {subscription.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {subscription.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {subscription.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconAction
              title={subscription.is_active ? "Deactivate" : "Activate"}
              onClick={onToggleActive}
              disabled={isToggling}
            >
              {subscription.is_active ? (
                <HiPause className="h-4 w-4" />
              ) : (
                <HiPlay className="h-4 w-4" />
              )}
            </IconAction>
            <IconAction title="Edit" onClick={onEdit}>
              <HiPencilSquare className="h-4 w-4" />
            </IconAction>
            <IconAction
              title="Delete"
              onClick={onDelete}
              disabled={isDeleting}
              danger
            >
              <HiTrash className="h-4 w-4" />
            </IconAction>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-4 text-sm">
        <DetailRow icon="💵" label="Amount:" value={CURRENCY.format(Number(subscription.amount))} />
        <DetailRow icon="📅" label="Period:" value={periodText} multiline />
        <DetailRow icon="🗓️" label="Payment:" value={paymentText} multiline />
      </div>

      <div className="space-y-2 border-t border-zinc-200 p-4 text-sm dark:border-zinc-800">
        {subscription.paymentMethod ? (
          <ChipRow label="Method" value={subscription.paymentMethod.name} tone="green" />
        ) : null}
        {subscription.paymentPlatform ? (
          <ChipRow label="Platform" value={subscription.paymentPlatform.name} tone="purple" />
        ) : null}
        {subscription.paymentTypes && subscription.paymentTypes.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Types:</span>
            {subscription.paymentTypes.map((t) => (
              <span
                key={t.id}
                className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              >
                {t.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IconAction({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800 ${
        danger ? "hover:text-danger dark:hover:text-danger" : ""
      }`}
    >
      {children}
    </button>
  );
}

function DetailRow({
  icon,
  label,
  value,
  multiline,
}: {
  icon: string;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <span aria-hidden>{icon}</span>
      <span className="text-zinc-500">{label}</span>
      <span
        className={`font-medium ${
          multiline ? "" : "truncate"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ChipRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "purple";
}) {
  const map = {
    green:
      "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  } as const;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">{label}:</span>
      <span
        className={`rounded-md px-2 py-0.5 text-xs font-medium ${map[tone]}`}
      >
        {value}
      </span>
    </div>
  );
}
