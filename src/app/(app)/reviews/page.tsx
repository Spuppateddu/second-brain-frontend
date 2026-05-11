"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiEye,
  HiPencilSquare,
  HiPlus,
  HiStar,
  HiTrash,
} from "react-icons/hi2";

import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { IconButton } from "@/components/UI/IconButton";
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
            i < rating
              ? "text-yellow-400"
              : "text-secondary-300 dark:text-secondary-600",
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
      aria-pressed={active}
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
    <article className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700">
      <div className="flex items-start justify-between gap-3">
        {category ? (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </span>
        ) : (
          <Badge variant="neutral">Uncategorized</Badge>
        )}
        <StarRating value={review.rating} />
      </div>

      <h2 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
        {review.title}
      </h2>

      {review.content && (
        <p className="line-clamp-3 text-sm text-secondary-600 dark:text-secondary-400">
          {review.content}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div className="flex flex-col text-xs text-secondary-500 dark:text-secondary-400">
          {completion && <span>Completed: {completion}</span>}
          {updated && <span>Review: {updated}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <Link href={`/reviews/${review.id}`} aria-label="View review">
            <IconButton size="sm" variant="secondary" label="View review">
              <HiEye />
            </IconButton>
          </Link>
          <Link href={`/reviews/${review.id}/edit`} aria-label="Edit review">
            <IconButton size="sm" variant="secondary" label="Edit review">
              <HiPencilSquare />
            </IconButton>
          </Link>
          <IconButton
            size="sm"
            variant="danger"
            label="Delete review"
            onClick={() => {
              if (confirm("Delete this review?")) onDelete(review.id);
            }}
          >
            <HiTrash />
          </IconButton>
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Reviews
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/reviews/categories">
              <Button variant="secondary" size="sm">
                Manage Categories
              </Button>
            </Link>
            <IconButton
              variant="primary"
              size="sm"
              label="New review"
              onClick={() => router.push("/reviews/new")}
            >
              <HiPlus />
            </IconButton>
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
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            Loading…
          </p>
        ) : error ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            Couldn&rsquo;t load the reviews. Try refreshing.
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            No reviews yet.
          </p>
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
    </div>
  );
}
