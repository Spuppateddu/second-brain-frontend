"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { HiPencilSquare, HiStar } from "react-icons/hi2";

import { useReview, useReviewCategories } from "@/lib/queries/entities";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return DATE_FMT.format(d);
}

export default function ShowReviewPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading, error } = useReview(Number.isFinite(id) ? id : null);
  const cats = useReviewCategories();

  const category =
    data?.reviewCategory ??
    data?.review_category ??
    (data?.review_category_id != null
      ? (cats.data?.find((c) => c.id === data.review_category_id) ?? null)
      : null);

  const completion = formatDate(data?.completion_date);
  const updated = formatDate(data?.updated_at ?? data?.created_at);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Review</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/reviews/${id}/edit`}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <HiPencilSquare className="h-4 w-4" /> Edit
          </Link>
          <Link
            href="/reviews"
            className="inline-flex items-center rounded-md bg-zinc-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600"
          >
            Back
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : error || !data ? (
        <p className="text-sm text-danger">Couldn&rsquo;t load this review.</p>
      ) : (
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {category ? (
              <span
                className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium text-white"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-200 px-3 py-0.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Uncategorized
              </span>
            )}
            <span className="inline-flex items-center" aria-label={`${data.rating ?? 0} stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <HiStar
                  key={i}
                  className={[
                    "h-6 w-6",
                    i < (data.rating ?? 0)
                      ? "text-yellow-400"
                      : "text-zinc-300 dark:text-zinc-600",
                  ].join(" ")}
                />
              ))}
            </span>
          </div>

          <h2 className="text-2xl font-bold">{data.title}</h2>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-500">
            {completion && <span>Completed: {completion}</span>}
            {updated && <span>Last updated: {updated}</span>}
          </div>

          {data.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {data.content}
            </p>
          ) : (
            <p className="text-sm italic text-zinc-500">No review text yet.</p>
          )}
        </article>
      )}
    </div>
  );
}
