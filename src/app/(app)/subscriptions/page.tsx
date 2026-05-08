"use client";

import { useEffect, useRef, useState } from "react";
import {
  HiChevronDown,
  HiPauseCircle,
  HiPencilSquare,
  HiPlayCircle,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
import { Textarea } from "@/components/UI/Textarea";
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Subscription management
          </h1>
        </header>

        {error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            Couldn&rsquo;t load the subscriptions. Try refreshing.
          </p>
        ) : null}

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
          <StatCard
            label="Active subscriptions"
            value={activeCount}
            tone="success"
          />
          <StatCard
            label="Total subscriptions"
            value={subscriptions.length}
            tone="neutral"
          />
        </div>

        <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
                Generate monthly payments
              </h3>
              <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                Create payment entries for active subscriptions for the current
                month (future/present dates only).
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerate}
              disabled={generatePayments.isPending}
              loading={generatePayments.isPending}
            >
              Generate payments
            </Button>
          </div>
          {genMessage ? (
            <p
              className={`mt-3 text-sm ${
                genMessage.tone === "success"
                  ? "text-success-600 dark:text-success-400"
                  : "text-danger-600 dark:text-danger-400"
              }`}
            >
              {genMessage.text}
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-secondary-500 dark:text-secondary-400">
            Loading…
          </p>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white py-12 text-center shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
            <p className="mb-4 text-base text-secondary-600 dark:text-secondary-400">
              No subscriptions configured yet.
            </p>
            <Button variant="primary" size="sm" onClick={startCreate}>
              Create your first subscription
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Active subscriptions ({activeCount})
            </h2>
            <p className="mb-4 text-sm text-secondary-500 dark:text-secondary-400">
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
  tone: "success" | "neutral";
}) {
  const map = {
    success: {
      bg: "bg-success-50 dark:bg-success-900/30",
      border: "border-success-200 dark:border-success-700",
      title: "text-success-800 dark:text-success-300",
      value: "text-success-900 dark:text-success-100",
    },
    neutral: {
      bg: "bg-secondary-50 dark:bg-secondary-900",
      border: "border-secondary-200 dark:border-secondary-700",
      title: "text-secondary-700 dark:text-secondary-300",
      value: "text-secondary-900 dark:text-secondary-100",
    },
  } as const;
  const c = map[tone];
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-4 ${c.bg} ${c.border}`}
    >
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
  const title = editing ? "Edit subscription" : "Create subscription";
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-secondary-200 bg-white shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-900"
      >
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4 text-secondary-500" />
          <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            {title}
          </span>
        </div>
        <HiChevronDown
          className={`h-5 w-5 text-secondary-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-secondary-200 p-5 dark:border-secondary-800">
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
      <Input
        label="Subscription name"
        type="text"
        placeholder="e.g., Netflix Premium"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
      />

      <Textarea
        label="Description (optional)"
        placeholder="Brief description of this subscription…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        fullWidth
      />

      <Input
        label="Subscription amount"
        type="number"
        step="0.01"
        min={0}
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        fullWidth
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
        />
        <Input
          label="End date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          helperText="Leave empty for ongoing subscription"
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Payment day"
          value={paymentDay}
          onChange={(e) => setPaymentDay(Number(e.target.value))}
          helperText="Day of the month for payment"
          fullWidth
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select
          label="Payment frequency"
          value={frequency}
          onChange={(e) =>
            setFrequency(e.target.value as SubscriptionFrequency)
          }
          fullWidth
        >
          <option value="monthly">Monthly</option>
          <option value="3_months">Every 3 months</option>
          <option value="6_months">Every 6 months</option>
          <option value="annual">Annual</option>
        </Select>
      </div>

      <SelectLookup
        label="Payment method"
        options={paymentMethods}
        value={methodId}
        onChange={setMethodId}
        placeholder="Select payment method"
      />
      <SelectLookup
        label="Payment platform"
        options={paymentPlatforms}
        value={platformId}
        onChange={setPlatformId}
        placeholder="Select payment platform"
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Payment types
        </label>
        <p className="mb-1 text-xs text-secondary-500 dark:text-secondary-400">
          Select at least one payment type for this subscription.
        </p>
        <MultiSelectDropdown
          options={paymentTypes}
          value={typeIds}
          onChange={setTypeIds}
          placeholder="Select payment types"
        />
      </div>

      {error ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-secondary-200 pt-4 dark:border-secondary-800">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={isPending}
          loading={isPending}
        >
          {editing ? "Update subscription" : "Create subscription"}
        </Button>
      </div>
    </div>
  );
}

function SelectLookup({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  options: PaymentLookup[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder: string;
}) {
  return (
    <Select
      label={label}
      value={value === null ? "" : String(value)}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      fullWidth
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </Select>
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
        className="flex w-full items-center justify-between rounded-md border border-secondary-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100"
      >
        <span
          className={
            value.length === 0
              ? "text-secondary-400 dark:text-secondary-500"
              : "truncate"
          }
        >
          {label}
        </span>
        <HiChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-secondary-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md border border-secondary-200 bg-white py-1 shadow-lg dark:border-secondary-700 dark:bg-secondary-900">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-secondary-500">No options.</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-800"
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
    <article className="flex flex-col rounded-[var(--radius-card)] border border-secondary-200 bg-white shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700">
      <div className="border-b border-secondary-200 p-4 dark:border-secondary-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-secondary-900 dark:text-secondary-100">
                {subscription.name}
              </h3>
              <Badge variant={subscription.is_active ? "success" : "neutral"}>
                {subscription.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {subscription.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-secondary-600 dark:text-secondary-400">
                {subscription.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              size="sm"
              variant="secondary"
              label={subscription.is_active ? "Deactivate" : "Activate"}
              onClick={onToggleActive}
              disabled={isToggling}
            >
              {subscription.is_active ? <HiPauseCircle /> : <HiPlayCircle />}
            </IconButton>
            <IconButton
              size="sm"
              variant="secondary"
              label="Edit"
              onClick={onEdit}
            >
              <HiPencilSquare />
            </IconButton>
            <IconButton
              size="sm"
              variant="danger"
              label="Delete"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <HiTrash />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-4 text-sm">
        <DetailRow
          icon="💵"
          label="Amount:"
          value={CURRENCY.format(Number(subscription.amount))}
        />
        <DetailRow icon="📅" label="Period:" value={periodText} multiline />
        <DetailRow icon="🗓️" label="Payment:" value={paymentText} multiline />
      </div>

      <div className="space-y-2 border-t border-secondary-200 p-4 text-sm dark:border-secondary-800">
        {subscription.paymentMethod ? (
          <ChipRow
            label="Method"
            value={subscription.paymentMethod.name}
            variant="success"
          />
        ) : null}
        {subscription.paymentPlatform ? (
          <ChipRow
            label="Platform"
            value={subscription.paymentPlatform.name}
            variant="accent"
          />
        ) : null}
        {subscription.paymentTypes && subscription.paymentTypes.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              Types:
            </span>
            {subscription.paymentTypes.map((t) => (
              <Badge key={t.id} variant="info">
                {t.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </article>
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
      <span className="text-secondary-500 dark:text-secondary-400">{label}</span>
      <span
        className={`font-medium text-secondary-900 dark:text-secondary-100 ${
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
  variant,
}: {
  label: string;
  value: string;
  variant: "success" | "accent";
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-secondary-500 dark:text-secondary-400">
        {label}:
      </span>
      <Badge variant={variant}>{value}</Badge>
    </div>
  );
}
