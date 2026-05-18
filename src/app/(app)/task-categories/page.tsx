"use client";

import { useMemo, useState } from "react";
import {
  HiCheck,
  HiPencilSquare,
  HiPlus,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import {
  type TaskCategory,
  useCreateTaskCategory,
  useDeleteTaskCategory,
  useTaskCategories,
  useUpdateTaskCategory,
} from "@/lib/queries/entities";

const PRESET_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#78716C",
  "#6B7280",
  "#1F2937",
];

export default function TaskCategoriesPage() {
  const { data, isLoading, error } = useTaskCategories();
  const create = useCreateTaskCategory();
  const update = useUpdateTaskCategory();
  const remove = useDeleteTaskCategory();

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TaskCategory | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [keywordsText, setKeywordsText] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const term = searchQuery.toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, searchQuery]);

  function resetForm() {
    setShowForm(false);
    setEditing(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setKeywordsText("");
    setFormError("");
  }

  function startCreate() {
    setEditing(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setKeywordsText("");
    setFormError("");
    setShowForm(true);
  }

  function startEdit(cat: TaskCategory) {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setKeywordsText((cat.keywords ?? []).join(", "));
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Category name is required.");
      return;
    }
    setFormError("");
    const keywords = Array.from(
      new Set(
        keywordsText
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0),
      ),
    );
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          payload: { name: trimmed, color, keywords },
        });
      } else {
        await create.mutateAsync({ name: trimmed, color, keywords });
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
        setFormError(response?.data?.message ?? "Failed to save category.");
      }
    }
  }

  async function handleDelete(id: number) {
    try {
      await remove.mutateAsync(id);
      setDeletingId(null);
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  }

  const isSubmitting = create.isPending || update.isPending;

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Task categories
          </h1>
          {!showForm ? (
            <IconButton
              variant="primary"
              size="sm"
              label="New category"
              onClick={startCreate}
            >
              <HiPlus />
            </IconButton>
          ) : null}
        </header>

        {showForm ? (
          <FormSection
            title={editing ? "Edit category" : "New category"}
            description="A name and a color used to tag tasks."
          >
            <Input
              label="Name *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              autoFocus
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) void handleSubmit();
              }}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Select color ${c}`}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-all duration-150 hover:scale-110 ${
                      color === c
                        ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-secondary-950"
                        : "ring-1 ring-secondary-200 hover:ring-secondary-400 dark:ring-secondary-700 dark:hover:ring-secondary-500"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Input
              label="Keywords"
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="e.g. laravel, react, php"
              helperText="Comma-separated. New task titles are auto-matched against these words to suggest this category."
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) void handleSubmit();
              }}
            />

            {formError ? (
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {formError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <IconButton
                type="button"
                variant="ghost"
                size="md"
                label="Cancel"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                <HiXMark />
              </IconButton>
              <IconButton
                type="button"
                variant="primary"
                size="md"
                loading={isSubmitting}
                disabled={isSubmitting || !name.trim()}
                label={editing ? "Save" : "Create"}
                onClick={() => void handleSubmit()}
              >
                <HiCheck />
              </IconButton>
            </div>
          </FormSection>
        ) : null}

        {error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            Couldn&rsquo;t load the categories. Try refreshing.
          </p>
        ) : null}

        {categories.length > 0 ? (
          <Input
            type="text"
            placeholder="Search categories by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
        ) : null}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-secondary-500">
            Loading…
          </p>
        ) : categories.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-12 text-center shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
            <p className="mb-4 text-base text-secondary-600 dark:text-secondary-400">
              No categories configured yet.
            </p>
            <IconButton
              variant="primary"
              size="lg"
              label="Create your first category"
              onClick={startCreate}
            >
              <HiPlus />
            </IconButton>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-secondary-500">
            No categories found for &ldquo;{searchQuery}&rdquo;
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={() => startEdit(category)}
                deleting={deletingId === category.id}
                onAskDelete={() => setDeletingId(category.id)}
                onCancelDelete={() => setDeletingId(null)}
                onConfirmDelete={() => handleDelete(category.id)}
                isDeleting={remove.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onEdit,
  deleting,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  isDeleting,
}: {
  category: TaskCategory;
  onEdit: () => void;
  deleting: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <article className="flex items-center gap-4 rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700 sm:p-5">
      <span
        className="h-8 w-8 shrink-0 rounded-full ring-1 ring-secondary-200 dark:ring-secondary-800"
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
      <span className="flex-1 truncate text-base font-semibold text-secondary-900 dark:text-secondary-100 sm:text-lg">
        {category.name}
      </span>

      {deleting ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-danger-600 dark:text-danger-400">
            Delete?
          </span>
          <IconButton
            size="sm"
            variant="danger"
            label="Confirm delete"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            <HiCheck />
          </IconButton>
          <IconButton
            size="sm"
            variant="secondary"
            label="Cancel"
            onClick={onCancelDelete}
          >
            <HiXMark />
          </IconButton>
        </div>
      ) : (
        <div className="flex gap-1.5">
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
            onClick={onAskDelete}
          >
            <HiTrash />
          </IconButton>
        </div>
      )}
    </article>
  );
}
