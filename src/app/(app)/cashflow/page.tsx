"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import {
  HiChartBar,
  HiChartPie,
  HiChevronDown,
  HiFunnel,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiPlus,
} from "react-icons/hi2";

import { CashflowBreakdownChart } from "@/components/CashflowBreakdownChart";
import { CashflowTrendsChart } from "@/components/cashflow/CashflowTrendsChart";
import { Input } from "@/components/UI/Input";
import {
  type PaymentInput,
  useCashflow,
  useCashflowChartData,
  useCashflowFiltered,
  useCashflowTrends,
  useCreatePayment,
  useUpdatePayment,
} from "@/lib/queries/heavy";
import type {
  CashflowFilters,
  Payment,
  PaymentLookup,
} from "@/types/heavy";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const EMPTY_FILTERS: CashflowFilters = {
  search: "",
  start_date: "",
  end_date: "",
  amount_operator: "=",
  amount_value: "",
  payment_methods: [],
  payment_platforms: [],
  payment_types: [],
  subscription_filter: "any",
};

function hasActiveFilters(filters: CashflowFilters): boolean {
  if (filters.search) return true;
  if (filters.start_date) return true;
  if (filters.end_date) return true;
  if (filters.amount_value) return true;
  if (filters.subscription_filter && filters.subscription_filter !== "any")
    return true;
  if ((filters.payment_methods?.length ?? 0) > 0) return true;
  if ((filters.payment_platforms?.length ?? 0) > 0) return true;
  if ((filters.payment_types?.length ?? 0) > 0) return true;
  return false;
}

export default function CashflowPage() {
  const [appliedFilters, setAppliedFilters] =
    useState<CashflowFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<CashflowFilters>(EMPTY_FILTERS);

  const baseQuery = useCashflow();
  const filtersActive = hasActiveFilters(appliedFilters);
  const filteredQuery = useCashflowFiltered(appliedFilters);

  const paymentMethods = baseQuery.data?.paymentMethods ?? [];
  const paymentPlatforms = baseQuery.data?.paymentPlatforms ?? [];
  const paymentTypes = baseQuery.data?.paymentTypes ?? [];

  const payments = filtersActive
    ? (filteredQuery.data?.payments ?? [])
    : (baseQuery.data?.payments ?? []);
  const summary = filtersActive
    ? (filteredQuery.data?.summary ?? { positive: 0, negative: 0, net: 0 })
    : (baseQuery.data?.summary ?? { positive: 0, negative: 0, net: 0 });

  const isLoading = baseQuery.isLoading || (filtersActive && filteredQuery.isLoading);

  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Cashflow Management</h1>
      </header>

      {baseQuery.error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the cashflow data. Try refreshing.
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-7xl space-y-6">
        <AddPaymentAccordion
          paymentMethods={paymentMethods}
          paymentPlatforms={paymentPlatforms}
          paymentTypes={paymentTypes}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            tone={summary.net >= 0 ? "blue" : "orange"}
            label="Net Cashflow"
            value={summary.net}
          />
          <SummaryCard tone="red" label="Total Expenses" value={summary.negative} />
          <SummaryCard tone="green" label="Total Income" value={summary.positive} />
        </div>

        <FilterAccordion
          filters={draftFilters}
          onChange={setDraftFilters}
          paymentMethods={paymentMethods}
          paymentPlatforms={paymentPlatforms}
          paymentTypes={paymentTypes}
          isApplying={filteredQuery.isFetching}
          onApply={() => setAppliedFilters({ ...draftFilters })}
          onClear={() => {
            setDraftFilters(EMPTY_FILTERS);
            setAppliedFilters(EMPTY_FILTERS);
          }}
          active={filtersActive}
        />

        <PaymentsTable
          payments={payments}
          isLoading={isLoading}
          onEdit={(p) => setEditingPayment(p)}
        />

        <ChartAccordion
          title="Expense Distribution (Filtered)"
          icon={<HiChartPie className="h-4 w-4 text-zinc-500" />}
        >
          <ExpenseDistribution filters={appliedFilters} />
        </ChartAccordion>

        <ChartAccordion
          title="Cashflow Trends"
          icon={<HiChartBar className="h-4 w-4 text-zinc-500" />}
          lazy
        >
          <CashflowTrends />
        </ChartAccordion>
      </div>

      {editingPayment ? (
        <EditPaymentModal
          payment={editingPayment}
          paymentMethods={paymentMethods}
          paymentPlatforms={paymentPlatforms}
          paymentTypes={paymentTypes}
          onClose={() => setEditingPayment(null)}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  tone,
  label,
  value,
}: {
  tone: "blue" | "orange" | "red" | "green";
  label: string;
  value: number;
}) {
  const map: Record<typeof tone, { bg: string; border: string; title: string; value: string }> = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-700",
      title: "text-blue-800 dark:text-blue-300",
      value: "text-blue-900 dark:text-blue-100",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/30",
      border: "border-orange-200 dark:border-orange-700",
      title: "text-orange-800 dark:text-orange-300",
      value: "text-orange-900 dark:text-orange-100",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-700",
      title: "text-red-800 dark:text-red-300",
      value: "text-red-900 dark:text-red-100",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-700",
      title: "text-green-800 dark:text-green-300",
      value: "text-green-900 dark:text-green-100",
    },
  };
  const c = map[tone];
  return (
    <div className={`rounded-lg border p-4 ${c.bg} ${c.border}`}>
      <h3 className={`text-sm font-medium ${c.title}`}>{label}</h3>
      <p className={`text-2xl font-bold ${c.value}`}>{CURRENCY.format(value)}</p>
    </div>
  );
}

function Accordion({
  title,
  badge,
  icon,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  title: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  function toggle() {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        <HiChevronDown
          className={`h-5 w-5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ChartAccordion({
  title,
  icon,
  children,
  lazy,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  lazy?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  return (
    <Accordion title={title} icon={icon} onOpenChange={(open) => open && setOpened(true)}>
      {lazy && !opened ? null : children}
    </Accordion>
  );
}

function AddPaymentAccordion({
  paymentMethods,
  paymentPlatforms,
  paymentTypes,
}: {
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
}) {
  const create = useCreatePayment();
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [methodId, setMethodId] = useState<number | null>(null);
  const [platformId, setPlatformId] = useState<number | null>(null);
  const [typeIds, setTypeIds] = useState<number[]>([]);
  const [isSubscription, setIsSubscription] = useState(false);
  const [isPositive, setIsPositive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setAmount("");
    setDate(today);
    setMethodId(null);
    setPlatformId(null);
    setTypeIds([]);
    setIsSubscription(false);
    setIsPositive(false);
    setError(null);
  }

  async function submit() {
    setError(null);
    if (!name.trim() || !amount || methodId === null || platformId === null) {
      setError("Compila i campi obbligatori");
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        amount: Number(amount),
        date,
        payment_method_id: methodId,
        payment_platform_id: platformId,
        payment_type_ids: typeIds,
        is_subscription: isSubscription,
        is_positive_cashflow: isPositive,
      });
      reset();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(message);
    }
  }

  return (
    <Accordion title="Add Payment" icon={<HiPlus className="h-4 w-4" />}>
      <div className="space-y-4">
        <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
          Only add payments over 1 euro.
        </p>

        <FormField label="Description">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
        </FormField>

        <div>
          <span className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
            Transaction Type
          </span>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="transaction-type"
                checked={!isPositive}
                onChange={() => setIsPositive(false)}
              />
              Expense
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="transaction-type"
                checked={isPositive}
                onChange={() => setIsPositive(true)}
              />
              Income
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Amount">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />
          </FormField>
          <FormField label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
            />
          </FormField>
          <FormField label="Payment Method">
            <SelectLookup
              options={paymentMethods}
              value={methodId}
              onChange={setMethodId}
              placeholder="Select payment method"
            />
          </FormField>
          <FormField label="Payment Platform">
            <SelectLookup
              options={paymentPlatforms}
              value={platformId}
              onChange={setPlatformId}
              placeholder="Select payment platform"
            />
          </FormField>
        </div>

        <FormField label="Payment Types">
          <MultiSelectDropdown
            options={paymentTypes}
            value={typeIds}
            onChange={setTypeIds}
            placeholder="Select payment types"
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isSubscription}
            onChange={(e) => setIsSubscription(e.target.checked)}
          />
          This is a subscription payment
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={reset}
            isDisabled={create.isPending}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            isDisabled={create.isPending}
          >
            {create.isPending ? "Saving…" : "Add Payment"}
          </Button>
        </div>
      </div>
    </Accordion>
  );
}

function FilterAccordion({
  filters,
  onChange,
  paymentMethods,
  paymentPlatforms,
  paymentTypes,
  onApply,
  onClear,
  isApplying,
  active,
}: {
  filters: CashflowFilters;
  onChange: (next: CashflowFilters) => void;
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  onApply: () => void;
  onClear: () => void;
  isApplying: boolean;
  active: boolean;
}) {
  function patch<K extends keyof CashflowFilters>(
    key: K,
    value: CashflowFilters[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <Accordion
      title="Filters"
      icon={<HiFunnel className="h-4 w-4" />}
      badge={
        active ? (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Active
          </span>
        ) : null
      }
    >
      <div className="space-y-4">
        <FormField label="Search by name">
          <Input
            type="text"
            placeholder="Enter payment name..."
            value={filters.search ?? ""}
            onChange={(e) => patch("search", e.target.value)}
            leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
            fullWidth
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Start Date">
            <Input
              type="date"
              value={filters.start_date ?? ""}
              onChange={(e) => patch("start_date", e.target.value)}
              fullWidth
            />
          </FormField>
          <FormField label="End Date">
            <Input
              type="date"
              value={filters.end_date ?? ""}
              onChange={(e) => patch("end_date", e.target.value)}
              fullWidth
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Amount Comparison">
            <select
              value={filters.amount_operator ?? "="}
              onChange={(e) =>
                patch(
                  "amount_operator",
                  e.target.value as CashflowFilters["amount_operator"],
                )
              }
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="=">Equals</option>
              <option value=">">Greater than</option>
              <option value="<">Less than</option>
              <option value=">=">Greater than or equal</option>
              <option value="<=">Less than or equal</option>
            </select>
          </FormField>
          <FormField label="Amount Value">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={filters.amount_value ?? ""}
              onChange={(e) => patch("amount_value", e.target.value)}
              fullWidth
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Payment Methods">
            <MultiSelectDropdown
              options={paymentMethods}
              value={filters.payment_methods ?? []}
              onChange={(v) => patch("payment_methods", v)}
              placeholder="Select payment methods"
            />
          </FormField>
          <FormField label="Payment Platforms">
            <MultiSelectDropdown
              options={paymentPlatforms}
              value={filters.payment_platforms ?? []}
              onChange={(v) => patch("payment_platforms", v)}
              placeholder="Select payment platforms"
            />
          </FormField>
          <FormField label="Payment Types">
            <MultiSelectDropdown
              options={paymentTypes}
              value={filters.payment_types ?? []}
              onChange={(v) => patch("payment_types", v)}
              placeholder="Select payment types"
            />
          </FormField>
        </div>

        <FormField label="Subscription Filter">
          <select
            value={filters.subscription_filter ?? "any"}
            onChange={(e) =>
              patch(
                "subscription_filter",
                e.target.value as CashflowFilters["subscription_filter"],
              )
            }
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="any">Any</option>
            <option value="yes">Recurring only</option>
            <option value="no">Non-recurring only</option>
          </select>
        </FormField>

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button variant="secondary" onClick={onClear} isDisabled={isApplying}>
            Clear Filters
          </Button>
          <Button variant="primary" onClick={onApply} isDisabled={isApplying}>
            {isApplying ? "Filtering…" : "Apply Filters"}
          </Button>
        </div>
      </div>
    </Accordion>
  );
}

function PaymentsTable({
  payments,
  isLoading,
  onEdit,
}: {
  payments: Payment[];
  isLoading: boolean;
  onEdit: (p: Payment) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h3 className="text-lg font-medium">
          Recent Payments{" "}
          {isLoading ? (
            <span className="text-sm text-zinc-500">(Loading…)</span>
          ) : (
            <span className="text-sm text-zinc-500">
              ({payments.length} payments)
            </span>
          )}
        </h3>
      </div>
      <div className="max-h-96 overflow-x-auto overflow-y-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <Th>Name</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Method</Th>
              <Th>Platform</Th>
              <Th>Type</Th>
              <Th>Subscription</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <td className="whitespace-nowrap px-6 py-3">{payment.name}</td>
                <td
                  className={`whitespace-nowrap px-6 py-3 font-medium ${
                    payment.is_positive_cashflow
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {payment.is_positive_cashflow ? "+" : ""}
                  {CURRENCY.format(Number(payment.amount))}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-zinc-500">
                  {payment.date.split("T")[0]}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-zinc-500">
                  {payment.payment_method?.name ?? "—"}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-zinc-500">
                  {payment.payment_platform?.name ?? "—"}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-zinc-500">
                  {payment.payment_types?.map((t) => t.name).join(", ") ?? ""}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-zinc-500">
                  {payment.is_subscription ? "Yes" : "No"}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-zinc-500">
                  <button
                    type="button"
                    onClick={() => onEdit(payment)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit payment"
                  >
                    <HiPencilSquare className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="bg-zinc-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </th>
  );
}

function ExpenseDistribution({ filters }: { filters: CashflowFilters }) {
  const { data, isLoading, error } = useCashflowChartData(filters);
  if (isLoading)
    return <p className="text-sm text-zinc-500">Loading chart data…</p>;
  if (error)
    return <p className="text-sm text-danger">Couldn&rsquo;t load charts.</p>;
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <CashflowBreakdownChart title="By method" data={data.methods} />
      <CashflowBreakdownChart title="By platform" data={data.platforms} />
      <CashflowBreakdownChart title="By type" data={data.types} />
    </div>
  );
}

function CashflowTrends() {
  const { data, isLoading, error } = useCashflowTrends();
  if (isLoading)
    return <p className="text-sm text-zinc-500">Loading trends data…</p>;
  if (error)
    return <p className="text-sm text-danger">Couldn&rsquo;t load trends.</p>;
  if (!data || data.length === 0)
    return <p className="text-sm text-zinc-500">No trend data yet.</p>;
  return <CashflowTrendsChart data={data} />;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectLookup({
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  options: PaymentLookup[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
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
  placeholder = "Select…",
}: {
  options: PaymentLookup[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
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

function EditPaymentModal({
  payment,
  paymentMethods,
  paymentPlatforms,
  paymentTypes,
  onClose,
}: {
  payment: Payment;
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  onClose: () => void;
}) {
  const update = useUpdatePayment();
  const [name, setName] = useState(payment.name);
  const [amount, setAmount] = useState(String(payment.amount));
  const [date, setDate] = useState(payment.date.split("T")[0]);
  const [methodId, setMethodId] = useState<number | null>(
    payment.payment_method?.id ?? null,
  );
  const [platformId, setPlatformId] = useState<number | null>(
    payment.payment_platform?.id ?? null,
  );
  const [typeIds, setTypeIds] = useState<number[]>(
    payment.payment_types?.map((t) => t.id) ?? [],
  );
  const [isSubscription, setIsSubscription] = useState(payment.is_subscription);
  const [isPositive, setIsPositive] = useState(payment.is_positive_cashflow);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim() || !amount || methodId === null || platformId === null) {
      setError("Compila i campi obbligatori");
      return;
    }
    const payload: PaymentInput = {
      name: name.trim(),
      amount: Number(amount),
      date,
      payment_method_id: methodId,
      payment_platform_id: platformId,
      payment_type_ids: typeIds,
      is_subscription: isSubscription,
      is_positive_cashflow: isPositive,
    };
    try {
      await update.mutateAsync({ id: payment.id, payload });
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-12 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold">Edit payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Name *">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
            </FormField>
            <FormField label="Amount *">
              <Input
                type="number"
                step="0.01"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
              />
            </FormField>
            <FormField label="Date *">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
              />
            </FormField>
            <FormField label="Method *">
              <SelectLookup
                options={paymentMethods}
                value={methodId}
                onChange={setMethodId}
              />
            </FormField>
            <FormField label="Platform *">
              <SelectLookup
                options={paymentPlatforms}
                value={platformId}
                onChange={setPlatformId}
              />
            </FormField>
            <FormField label="Types">
              <MultiSelectDropdown
                options={paymentTypes}
                value={typeIds}
                onChange={setTypeIds}
                placeholder="Select payment types"
              />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPositive}
                onChange={(e) => setIsPositive(e.target.checked)}
              />
              Income (positive cashflow)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
              />
              Recurring subscription
            </label>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              isDisabled={update.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              isDisabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
