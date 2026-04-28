"use client";

import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  HiChevronLeft,
  HiChevronRight,
  HiPencil,
  HiPlus,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import { Input } from "@/components/UI/Input";
import {
  type PaymentMethodFull,
  type PaymentPlatformFull,
  type PaymentTypeFull,
  useCreatePaymentMethod,
  useCreatePaymentPlatform,
  useCreatePaymentType,
  useDeletePaymentMethod,
  useDeletePaymentPlatform,
  useDeletePaymentType,
  usePaymentMethods,
  usePaymentPlatforms,
  usePaymentTypes,
  useUpdatePaymentMethod,
  useUpdatePaymentPlatform,
  useUpdatePaymentType,
} from "@/lib/queries/heavy";

const PAGE_SIZE = 10;

export default function CashflowOptionsPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Cashflow Options</h1>
      </header>

      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <label className="block text-sm font-medium">Search</label>
          <Input
            type="text"
            placeholder="Search all categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PaymentPlatformsColumn search={search} />
          <PaymentTypesColumn search={search} />
          <PaymentMethodsColumn search={search} />
        </div>
      </div>
    </div>
  );
}

function ColumnShell({
  title,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button variant="primary" size="sm" onClick={onAdd}>
          <HiPlus className="mr-1 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-3 text-sm text-zinc-500">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
        aria-label="Previous page"
      >
        <HiChevronLeft className="h-4 w-4" />
      </button>
      <span>
        Pagina {page} di {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
        aria-label="Next page"
      >
        <HiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function usePagedItems<T extends { name: string }>(
  items: T[],
  search: string,
) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  }, [items, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const [pageRaw, setPage] = useState(1);
  const page = Math.min(Math.max(1, pageRaw), totalPages);
  const offset = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(offset, offset + PAGE_SIZE);
  return { pageItems, page, totalPages, setPage };
}

function PaymentPlatformsColumn({ search }: { search: string }) {
  const { data, isLoading } = usePaymentPlatforms();
  const create = useCreatePaymentPlatform();
  const update = useUpdatePaymentPlatform();
  const remove = useDeletePaymentPlatform();

  const [editing, setEditing] = useState<PaymentPlatformFull | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [isDigital, setIsDigital] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = data ?? [];
  const { pageItems, page, totalPages, setPage } = usePagedItems(items, search);

  function startCreate() {
    setEditing(null);
    setName("");
    setIsDigital(false);
    setError(null);
    setShowForm(true);
  }
  function startEdit(p: PaymentPlatformFull) {
    setEditing(p);
    setName(p.name);
    setIsDigital(p.is_digital);
    setError(null);
    setShowForm(true);
  }
  function cancel() {
    setShowForm(false);
    setEditing(null);
    setError(null);
  }
  async function submit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          name: name.trim(),
          is_digital: isDigital,
        });
      } else {
        await create.mutateAsync({ name: name.trim(), is_digital: isDigital });
      }
      cancel();
    } catch (err) {
      setError(extractError(err));
    }
  }
  async function destroy(id: number) {
    if (!confirm("Delete this platform?")) return;
    await remove.mutateAsync(id);
  }

  const isSubmitting = create.isPending || update.isPending;

  return (
    <ColumnShell
      title="Payment Platforms"
      addLabel="Add Platform"
      onAdd={startCreate}
    >
      {showForm ? (
        <FormCard
          title={editing ? "Edit Platform" : "New Platform"}
          name={name}
          onNameChange={setName}
          extra={
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isDigital}
                onChange={(e) => setIsDigital(e.target.checked)}
              />
              Digital
            </label>
          }
          error={error}
          onCancel={cancel}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          submitLabel={editing ? "Update" : "Create"}
        />
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>
      ) : pageItems.length === 0 ? (
        <p className="py-6 text-center text-sm italic text-zinc-500">
          {search ? "No matches." : "No platforms yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {pageItems.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="text-xs text-zinc-500">
                  Digital: {p.is_digital ? "✓" : "✗"}
                </div>
              </div>
              <RowActions
                onEdit={() => startEdit(p)}
                onDelete={() => destroy(p.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </ColumnShell>
  );
}

function PaymentTypesColumn({ search }: { search: string }) {
  const { data, isLoading } = usePaymentTypes();
  const create = useCreatePaymentType();
  const update = useUpdatePaymentType();
  const remove = useDeletePaymentType();

  const [editing, setEditing] = useState<PaymentTypeFull | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const items = data ?? [];
  const { pageItems, page, totalPages, setPage } = usePagedItems(items, search);

  function startCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setShowForm(true);
  }
  function startEdit(t: PaymentTypeFull) {
    setEditing(t);
    setName(t.name);
    setError(null);
    setShowForm(true);
  }
  function cancel() {
    setShowForm(false);
    setEditing(null);
    setError(null);
  }
  async function submit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: name.trim() });
      } else {
        await create.mutateAsync({ name: name.trim() });
      }
      cancel();
    } catch (err) {
      setError(extractError(err));
    }
  }
  async function destroy(id: number) {
    if (!confirm("Delete this type?")) return;
    await remove.mutateAsync(id);
  }

  const isSubmitting = create.isPending || update.isPending;

  return (
    <ColumnShell title="Payment Types" addLabel="Add Type" onAdd={startCreate}>
      {showForm ? (
        <FormCard
          title={editing ? "Edit Type" : "New Type"}
          name={name}
          onNameChange={setName}
          error={error}
          onCancel={cancel}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          submitLabel={editing ? "Update" : "Create"}
        />
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>
      ) : pageItems.length === 0 ? (
        <p className="py-6 text-center text-sm italic text-zinc-500">
          {search ? "No matches." : "No types yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {pageItems.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
            >
              <span className="truncate text-sm font-medium">{t.name}</span>
              <RowActions
                onEdit={() => startEdit(t)}
                onDelete={() => destroy(t.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </ColumnShell>
  );
}

function PaymentMethodsColumn({ search }: { search: string }) {
  const { data, isLoading } = usePaymentMethods();
  const create = useCreatePaymentMethod();
  const update = useUpdatePaymentMethod();
  const remove = useDeletePaymentMethod();

  const [editing, setEditing] = useState<PaymentMethodFull | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const items = data ?? [];
  const { pageItems, page, totalPages, setPage } = usePagedItems(items, search);

  function startCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setShowForm(true);
  }
  function startEdit(m: PaymentMethodFull) {
    setEditing(m);
    setName(m.name);
    setError(null);
    setShowForm(true);
  }
  function cancel() {
    setShowForm(false);
    setEditing(null);
    setError(null);
  }
  async function submit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: name.trim() });
      } else {
        await create.mutateAsync({ name: name.trim() });
      }
      cancel();
    } catch (err) {
      setError(extractError(err));
    }
  }
  async function destroy(id: number) {
    if (!confirm("Delete this method?")) return;
    await remove.mutateAsync(id);
  }

  const isSubmitting = create.isPending || update.isPending;

  return (
    <ColumnShell
      title="Payment Methods"
      addLabel="Add Method"
      onAdd={startCreate}
    >
      {showForm ? (
        <FormCard
          title={editing ? "Edit Method" : "New Method"}
          name={name}
          onNameChange={setName}
          error={error}
          onCancel={cancel}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          submitLabel={editing ? "Update" : "Create"}
        />
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>
      ) : pageItems.length === 0 ? (
        <p className="py-6 text-center text-sm italic text-zinc-500">
          {search ? "No matches." : "No methods yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {pageItems.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
            >
              <span className="truncate text-sm font-medium">{m.name}</span>
              <RowActions
                onEdit={() => startEdit(m)}
                onDelete={() => destroy(m.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </ColumnShell>
  );
}

function FormCard({
  title,
  name,
  onNameChange,
  extra,
  error,
  onCancel,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  title: string;
  name: string;
  onNameChange: (v: string) => void;
  extra?: React.ReactNode;
  error: string | null;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          fullWidth
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSubmitting) onSubmit();
          }}
        />
        {extra}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onCancel}
            isDisabled={isSubmitting}
          >
            <HiXMark className="mr-1 h-4 w-4" />
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onSubmit}
            isDisabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
      >
        <HiPencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
      >
        <HiTrash className="h-4 w-4" />
      </button>
    </div>
  );
}

function extractError(err: unknown): string {
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
    return Array.isArray(first) ? first[0] : String(first);
  }
  return response?.data?.message ?? "Failed to save.";
}
