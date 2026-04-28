"use client";

import Link from "next/link";

import { ReviewForm } from "@/components/reviews/ReviewForm";

export default function NewReviewPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Create New Review</h1>
        <Link
          href="/reviews"
          className="inline-flex items-center rounded-md bg-zinc-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600"
        >
          Back
        </Link>
      </header>
      <ReviewForm />
    </div>
  );
}
