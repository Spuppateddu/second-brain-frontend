"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { HiTrash } from "react-icons/hi2";

import { BookmarkForm } from "@/components/BookmarkForm";
import { EntityListShell } from "@/components/EntityListShell";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import AnchorToggleButton from "@/components/SecondBrain/AnchorToggleButton";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
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
      <FormSection
        title="Details"
        actions={
          <IconButton
            size="sm"
            variant="danger"
            label="Delete bookmark"
            disabled={remove.isPending}
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
            <HiTrash />
          </IconButton>
        }
      >
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
                (err as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Failed to save.";
              setError(message);
            }
          }}
        />
      </FormSection>
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
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Invalid bookmark id.
        </p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Bookmark · ${data.title}` : "Bookmark"}
      isLoading={isLoading}
      error={error}
      headerActions={
        data ? <AnchorToggleButton type="bookmark" id={data.id} /> : undefined
      }
    >
      {data ? <BookmarkEditCard bookmark={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
