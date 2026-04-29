"use client";

import { Button } from "@heroui/react";
import { FormEvent, useEffect, useState } from "react";
import { HiStar } from "react-icons/hi2";

import { Input } from "@/components/UI/Input";
import {
  useCreateReview,
  type ReviewInput,
} from "@/lib/queries/entities";
import type { MediaTask, ReviewCategory } from "@/types/entities";

type Props = {
  open: boolean;
  onClose: () => void;
  task: MediaTask | null;
  reviewCategories: ReviewCategory[];
};

export function MediaReviewModal({ open, onClose, task, reviewCategories }: Props) {
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

  if (!open || !task) return null;

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
          <h2 className="text-base font-semibold">Write a review</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <MediaReviewForm
          key={`review-${task.id}`}
          task={task}
          reviewCategories={reviewCategories}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function MediaReviewForm({
  task,
  reviewCategories,
  onClose,
}: {
  task: MediaTask;
  reviewCategories: ReviewCategory[];
  onClose: () => void;
}) {
  const create = useCreateReview();

  const [title, setTitle] = useState(task.title);
  const [rating, setRating] = useState<number>(5);
  const [categoryId, setCategoryId] = useState<number | null>(
    task.review_category_id ?? null,
  );
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }
    setError(null);
    try {
      const payload: ReviewInput = {
        review_category_id: categoryId,
        title: title.trim(),
        rating,
        content: content.trim() || null,
        completion_date: completionDate || null,
        media_task_id: task.id,
      };
      await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save review.";
      setError(message);
    }
  }

  const submitting = create.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div>
        <label
          htmlFor="review-title"
          className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
        >
          Title <span className="text-danger">*</span>
        </label>
        <Input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="review-category"
          className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
        >
          Category
        </label>
        <select
          id="review-category"
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

      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
          Rating
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <HiStar
                  className={[
                    "h-7 w-7",
                    rating >= n
                      ? "text-yellow-400"
                      : "text-zinc-300 dark:text-zinc-600",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {rating}/5
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor="review-completion-date"
          className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
        >
          Completion date
        </label>
        <input
          id="review-completion-date"
          type="date"
          value={completionDate}
          onChange={(e) => setCompletionDate(e.target.value)}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="review-content"
          className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
        >
          Review
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="What did you think?"
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          isDisabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isDisabled={submitting}
        >
          {submitting ? "Saving…" : "Save & mark done"}
        </Button>
      </div>
    </form>
  );
}
