"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiStar } from "react-icons/hi2";

import {
  useCreateReview,
  useReviewCategories,
  useUpdateReview,
  type ReviewInput,
} from "@/lib/queries/entities";
import type { Review } from "@/types/entities";

type ReviewFormProps = {
  initial?: Review;
  redirectTo?: string;
};

export function ReviewForm({ initial, redirectTo = "/reviews" }: ReviewFormProps) {
  const router = useRouter();
  const editing = !!initial;
  const create = useCreateReview();
  const update = useUpdateReview(initial?.id ?? 0);
  const categoriesQuery = useReviewCategories();

  const [categoryId, setCategoryId] = useState<string>(
    initial?.review_category_id != null ? String(initial.review_category_id) : "",
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [rating, setRating] = useState<number>(initial?.rating ?? 5);
  const [completionDate, setCompletionDate] = useState(
    initial?.completion_date
      ? initial.completion_date.slice(0, 10)
      : "",
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 0 && rating >= 1 && rating <= 5 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: ReviewInput = {
        review_category_id:
          categoryId === "" ? null : Number(categoryId),
        title: title.trim(),
        rating,
        content: content.trim() || null,
        completion_date: completionDate || null,
      };
      if (editing) {
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }
      router.push(redirectTo);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="">Select a category</option>
          {categoriesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name of the book, game, anime, etc."
          required
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-800 dark:bg-zinc-950"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Rating</label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110"
                title={`${n} star${n > 1 ? "s" : ""}`}
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

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Completion date</label>
        <input
          type="date"
          value={completionDate}
          onChange={(e) => setCompletionDate(e.target.value)}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-800 dark:bg-zinc-950"
        />
        <p className="text-xs text-zinc-500">
          When did you finish reading/playing/watching this item? (optional)
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your detailed review…"
          rows={8}
          className="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-800 dark:bg-zinc-950"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={redirectTo}
          className="text-sm text-zinc-500 hover:underline"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Review"}
        </button>
      </div>
    </form>
  );
}
