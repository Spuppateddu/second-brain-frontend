"use client";

import { Button } from "@heroui/react";
import { FormEvent, useEffect, useState } from "react";

import { Input } from "@/components/UI/Input";
import type { MediaTaskInput } from "@/lib/queries/entities";
import type { MediaTask, ReviewCategory } from "@/types/entities";

type Props = {
  open: boolean;
  onClose: () => void;
  initialTask: MediaTask | null;
  defaultIsWatchlist: boolean;
  reviewCategories: ReviewCategory[];
  onSave: (payload: MediaTaskInput) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
};

export function MediaTaskModal(props: Props) {
  const { open, onClose, initialTask, defaultIsWatchlist } = props;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const formKey = initialTask ? `task-${initialTask.id}` : `new-${defaultIsWatchlist}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-20 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold">
            {initialTask ? "Edit media" : "New media"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <MediaTaskForm key={formKey} {...props} />
      </div>
    </div>
  );
}

function MediaTaskForm({
  onClose,
  initialTask,
  defaultIsWatchlist,
  reviewCategories,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: Props) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(
    initialTask?.description ?? "",
  );
  const [isWatchlist, setIsWatchlist] = useState(
    initialTask ? initialTask.is_watchlist : defaultIsWatchlist,
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    initialTask?.review_category_id ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const editing = initialTask !== null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        is_watchlist: isWatchlist,
        review_category_id: categoryId,
      });
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(message);
    }
  }

  async function handleDelete() {
    if (!initialTask || !onDelete) return;
    if (!confirm("Delete this media?")) return;
    try {
      await onDelete(initialTask.id);
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete.";
      setError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div>
        <label
          htmlFor="media-title"
          className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
        >
          Title <span className="text-danger">*</span>
        </label>
        <Input
          id="media-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you want to watch / read / play?"
          fullWidth
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="media-description"
          className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
        >
          Description
        </label>
        <textarea
          id="media-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional notes"
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="media-category"
          className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
        >
          Category
        </label>
        <select
          id="media-category"
          value={categoryId === null ? "" : String(categoryId)}
          onChange={(e) =>
            setCategoryId(
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">No category</option>
          {reviewCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isWatchlist}
          onChange={(e) => setIsWatchlist(e.target.checked)}
          className="rounded border-zinc-300 text-primary-600 shadow-sm focus:ring-primary-500 dark:border-zinc-600 dark:bg-zinc-800"
        />
        In watchlist
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex items-center justify-between gap-2 pt-2">
        <div>
          {editing && onDelete ? (
            <Button
              type="button"
              variant="danger-soft"
              size="sm"
              isDisabled={isDeleting || isSaving}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            isDisabled={isSaving || isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={isSaving || isDeleting}
          >
            {isSaving ? "Saving…" : editing ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );
}
