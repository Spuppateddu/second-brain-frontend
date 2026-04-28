"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { BookmarkForm } from "@/components/BookmarkForm";
import { EntityListShell } from "@/components/EntityListShell";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import {
  useBookmark,
  useDeleteBookmark,
  useUpdateBookmark,
} from "@/lib/queries/entities";
import type { Bookmark } from "@/types/entities";

function BookmarkEditCard({ bookmark }: { bookmark: Bookmark }) {
  const router = useRouter();
  const update = useUpdateBookmark(bookmark.id);
  const remove = useDeleteBookmark();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <BookmarkForm
        initial={bookmark}
        submitLabel="Save"
        isPending={update.isPending}
        error={error}
        onCancel={() => router.push("/bookmarks")}
        onSubmit={async (input) => {
          setError(null);
          try {
            await update.mutateAsync(input);
            router.push("/bookmarks");
          } catch (err) {
            const message =
              (err as { response?: { data?: { message?: string } } })?.response
                ?.data?.message ?? "Failed to save.";
            setError(message);
          }
        }}
      />
      <div className="flex items-center justify-end">
        <Button
          variant="danger-soft"
          size="sm"
          isDisabled={remove.isPending}
          onClick={async () => {
            if (!confirm("Delete this bookmark?")) return;
            try {
              await remove.mutateAsync(bookmark.id);
              router.push("/bookmarks");
            } catch {
              setError("Failed to delete.");
            }
          }}
        >
          Delete bookmark
        </Button>
      </div>
      <SharableLinksPanel type="bookmark" id={bookmark.id} />
      <LinkedEntitiesPanel type="bookmark" id={bookmark.id} />
    </div>
  );
}

export default function BookmarkEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  return (
    <EntityListShell
      title={data ? `Bookmark · ${data.title}` : "Bookmark"}
      isLoading={isLoading}
      error={error}
    >
      {data ? <BookmarkEditCard bookmark={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
