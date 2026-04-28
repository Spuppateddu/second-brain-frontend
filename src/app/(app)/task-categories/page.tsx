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
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, searchQuery]);

  function resetForm() {
    setShowForm(false);
    setEditing(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setFormError("");
  }

  function startCreate() {
    setEditing(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setFormError("");
    setShowForm(true);
  }

  function startEdit(cat: TaskCategory) {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Il nome della categoria è obbligatorio");
      return;
    }
    setFormError("");
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          payload: { name: trimmed, color },
        });
      } else {
        await create.mutateAsync({ name: trimmed, color });
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
        setFormError(
          response?.data?.message ??
            "Errore durante il salvataggio della categoria",
        );
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
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorie Task</h1>
        <Button variant="primary" size="sm" onClick={startCreate}>
          <HiPlus className="mr-1 h-4 w-4" />
          Nuova Categoria
        </Button>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-6">
        {showForm ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-4 text-lg font-semibold">
              {editing ? "Modifica Categoria" : "Nuova Categoria"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome della categoria"
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSubmitting) handleSubmit();
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Colore</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                        color === c
                          ? "border-zinc-900 ring-2 ring-zinc-400 ring-offset-2 dark:border-white"
                          : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
              {formError ? (
                <p className="text-sm text-danger">{formError}</p>
              ) : null}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={resetForm}>
                  Annulla
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isDisabled={isSubmitting || !name.trim()}
                >
                  {isSubmitting
                    ? "Salvataggio…"
                    : editing
                      ? "Aggiorna"
                      : "Crea"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-danger">
            Errore nel caricamento delle categorie.
          </p>
        ) : null}

        {categories.length > 0 ? (
          <Input
            type="text"
            placeholder="Cerca categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
        ) : null}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Caricamento…</p>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-lg text-zinc-500 dark:text-zinc-400">
              Nessuna categoria configurata.
            </p>
            <Button variant="primary" onClick={startCreate}>
              <HiPlus className="mr-1 h-4 w-4" />
              Crea la Tua Prima Categoria
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">
            Nessuna categoria trovata per &ldquo;{searchQuery}&rdquo;
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
    <div
      className="flex items-center gap-4 rounded-lg border-l-4 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      style={{ borderLeftColor: category.color }}
    >
      <span
        className="h-8 w-8 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      <span className="flex-1 truncate text-base font-semibold sm:text-lg">
        {category.name}
      </span>

      {deleting ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-danger">Eliminare?</span>
          <Button
            size="sm"
            variant="danger"
            onClick={onConfirmDelete}
            isDisabled={isDeleting}
          >
            <HiCheck className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={onCancelDelete}>
            <HiXMark className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <HiPencil className="mr-1 h-4 w-4" />
            Modifica
          </Button>
          <Button size="sm" variant="danger" onClick={onAskDelete}>
            <HiTrash className="mr-1 h-4 w-4" />
            Elimina
          </Button>
        </div>
      )}
    </div>
  );
}
