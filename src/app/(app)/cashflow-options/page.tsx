"use client";

import { useMemo, useState } from "react";
import {
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiPencilSquare,
  HiPlus,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import { IconButton } from "@/components/UI/IconButton";
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header>
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Cashflow options
          </h1>
        </header>

        <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
          <Input
            label="Search"
            type="text"
            placeholder="Search all categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
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
    <div className="flex flex-col rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
          {title}
        </h2>
        <IconButton
          variant="primary"
          size="sm"
          label={addLabel}
          onClick={onAdd}
        >
          <HiPlus />
        </IconButton>
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
    <div className="mt-3 flex items-center justify-center gap-3 text-sm text-secondary-500 dark:text-secondary-400">
      <IconButton
        size="xs"
        variant="ghost"
        label="Previous page"
        onClick={onPrev}
        disabled={page <= 1}
      >
        <HiChevronLeft />
      </IconButton>
      <span>
        Pagina {page} di {totalPages}
      </span>
      <IconButton
        size="xs"
        variant="ghost"
        label="Next page"
        onClick={onNext}
        disabled={page >= totalPages}
      >
        <HiChevronRight />
      </IconButton>
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
      title="Payment platforms"
      addLabel="Add platform"
      onAdd={startCreate}
    >
      {showForm ? (
        <FormCard
          title={editing ? "Edit platform" : "New platform"}
          name={name}
          onNameChange={setName}
          extra={
            <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
              <input
                type="checkbox"
                checked={isDigital}
                onChange={(e) => setIsDigital(e.target.checked)}
                className="h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
              />
              Digital
            </label>
          }
          error={error}
          onCancel={cancel}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          editing={!!editing}
        />
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-secondary-500 dark:text-secondary-400">
          Loading…
        </p>
      ) : pageItems.length === 0 ? (
        <p className="py-6 text-center text-sm italic text-secondary-500 dark:text-secondary-400">
          {search ? "No matches." : "No platforms yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {pageItems.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-[var(--radius-control)] bg-secondary-50 px-3 py-2 dark:bg-secondary-900"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {p.name}
                </div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400">
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
    <ColumnShell title="Payment types" addLabel="Add type" onAdd={startCreate}>
      {showForm ? (
        <FormCard
          title={editing ? "Edit type" : "New type"}
          name={name}
          onNameChange={setName}
          error={error}
          onCancel={cancel}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          editing={!!editing}
        />
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-secondary-500 dark:text-secondary-400">
          Loading…
        </p>
      ) : pageItems.length === 0 ? (
        <p className="py-6 text-center text-sm italic text-secondary-500 dark:text-secondary-400">
          {search ? "No matches." : "No types yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {pageItems.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-[var(--radius-control)] bg-secondary-50 px-3 py-2 dark:bg-secondary-900"
            >
              <span className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {t.name}
              </span>
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
      title="Payment methods"
      addLabel="Add method"
      onAdd={startCreate}
    >
      {showForm ? (
        <FormCard
          title={editing ? "Edit method" : "New method"}
          name={name}
          onNameChange={setName}
          error={error}
          onCancel={cancel}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          editing={!!editing}
        />
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-secondary-500 dark:text-secondary-400">
          Loading…
        </p>
      ) : pageItems.length === 0 ? (
        <p className="py-6 text-center text-sm italic text-secondary-500 dark:text-secondary-400">
          {search ? "No matches." : "No methods yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {pageItems.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-[var(--radius-control)] bg-secondary-50 px-3 py-2 dark:bg-secondary-900"
            >
              <span className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {m.name}
              </span>
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
  editing,
}: {
  title: string;
  name: string;
  onNameChange: (v: string) => void;
  extra?: React.ReactNode;
  error: string | null;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  editing: boolean;
}) {
  return (
    <div className="mb-3 rounded-[var(--radius-control)] border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-800 dark:bg-secondary-900">
      <h3 className="mb-2 text-sm font-semibold text-secondary-900 dark:text-secondary-100">
        {title}
      </h3>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          fullWidth
          isFocused
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSubmitting) onSubmit();
          }}
        />
        {extra}
        {error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <IconButton
            size="sm"
            variant="ghost"
            label="Cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <HiXMark />
          </IconButton>
          <IconButton
            size="sm"
            variant="primary"
            label={editing ? "Update" : "Create"}
            onClick={onSubmit}
            disabled={isSubmitting || !name.trim()}
            loading={isSubmitting}
          >
            <HiCheck />
          </IconButton>
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
      <IconButton size="xs" variant="secondary" label="Edit" onClick={onEdit}>
        <HiPencilSquare />
      </IconButton>
      <IconButton size="xs" variant="danger" label="Delete" onClick={onDelete}>
        <HiTrash />
      </IconButton>
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

