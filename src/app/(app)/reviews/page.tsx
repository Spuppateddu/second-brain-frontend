"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiEye,
  HiPencilSquare,
  HiPlus,
  HiStar,
} from "react-icons/hi2";

import { useDeleteReview, useReviews } from "@/lib/queries/entities";
import type { Review, ReviewCategory } from "@/types/entities";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return DATE_FMT.format(d);
}

function StarRating({ value }: { value: number | null }) {
  const rating = value ?? 0;
  return (
    <span className="inline-flex items-center" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <HiStar
          key={i}
          className={[
            "h-4 w-4",
            i < rating ? "text-yellow-400" : "text-zinc-300 dark:text-zinc-600",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

function CategoryPill({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string | null;
  active: boolean;
  onClick: () => void;
}) {
  const baseColor = color ?? "#64748b";
  const style = active
    ? {
        backgroundColor: baseColor,
        color: "#ffffff",
        borderColor: baseColor,
      }
    : {
        backgroundColor: `${baseColor}1A`,
        color: baseColor,
        borderColor: `${baseColor}55`,
      };
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-shadow",
        active ? "shadow-sm" : "hover:shadow-sm",
      ].join(" ")}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs opacity-80">({count})</span>
    </button>
  );
}

function ReviewCard({
  review,
  category,
  onDelete,
}: {
  review: Review;
  category: ReviewCategory | null;
  onDelete: (id: number) => void;
}) {
  const completion = formatDate(review.completion_date);
  const updated = formatDate(review.updated_at ?? review.created_at);
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        {category ? (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Uncategorized
          </span>
        )}
        <StarRating value={review.rating} />
      </div>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {review.title}
      </h2>

      {review.content && (
        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
          {review.content}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div className="flex flex-col text-xs text-zinc-500">
          {completion && <span>Completed: {completion}</span>}
          {updated && <span>Review: {updated}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/reviews/${review.id}`}
            title="View review"
            className="rounded p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <HiEye className="h-4 w-4" />
          </Link>
          <Link
            href={`/reviews/${review.id}/edit`}
            title="Edit review"
            className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <HiPencilSquare className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this review?")) onDelete(review.id);
            }}
            title="Delete review"
            className="rounded p-1 text-zinc-500 hover:bg-danger/10 hover:text-danger"
          >
            ×
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { data, isLoading, error } = useReviews(selectedCategory);
  const remove = useDeleteReview();

  const reviews = data?.reviews ?? [];
  const categories = data?.categories ?? [];
  const total = categories.reduce((s, c) => s + (c.reviews_count ?? 0), 0);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/reviews/categories"
            className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Manage Categories
          </Link>
          <button
            type="button"
            onClick={() => router.push("/reviews/new")}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800"
          >
            <HiPlus className="h-4 w-4" /> Review
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryPill
          label="All"
          count={total}
          color={null}
          active={selectedCategory === null}
          onClick={() => setSelectedCategory(null)}
        />
        {categories.map((c) => (
          <CategoryPill
            key={c.id}
            label={c.name}
            count={c.reviews_count ?? 0}
            color={c.color}
            active={selectedCategory === c.id}
            onClick={() => setSelectedCategory(c.id)}
          />
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the reviews. Try refreshing.
        </p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">No reviews yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => {
            const cat =
              r.reviewCategory ??
              r.review_category ??
              (r.review_category_id != null
                ? (categoryById.get(r.review_category_id) ?? null)
                : null);
            return (
              <ReviewCard
                key={r.id}
                review={r}
                category={cat}
                onDelete={(id) => remove.mutate(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
