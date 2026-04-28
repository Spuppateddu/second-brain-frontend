"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useReview } from "@/lib/queries/entities";

export default function EditReviewPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading, error } = useReview(Number.isFinite(id) ? id : null);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Edit Review</h1>
        <Link
          href="/reviews"
          className="inline-flex items-center rounded-md bg-zinc-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600"
        >
          Back
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : error || !data ? (
        <p className="text-sm text-danger">Couldn&rsquo;t load this review.</p>
      ) : (
        <ReviewForm initial={data} />
      )}
    </div>
  );
}
