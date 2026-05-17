"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import BookmarkEditor from "@/components/SecondBrain/forms/BookmarkEditor";
import { useBookmark } from "@/lib/queries/entities";

export default function EditBookmarkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const bookmarkId = Number(id);

  const { data, isLoading, error } = useBookmark(
    Number.isNaN(bookmarkId) ? null : bookmarkId,
  );

  if (Number.isNaN(bookmarkId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid bookmark id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading bookmark…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this bookmark.
      </main>
    );
  }

  return (
    <BookmarkEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="bookmark" id={data.id} />}
    />
  );
}
