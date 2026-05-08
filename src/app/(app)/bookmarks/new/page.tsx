"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BookmarkForm } from "@/components/BookmarkForm";
import { EntityListShell } from "@/components/EntityListShell";
import { FormSection } from "@/components/UI/FormSection";
import { useCreateBookmark } from "@/lib/queries/entities";

export default function NewBookmarkPage() {
  const router = useRouter();
  const create = useCreateBookmark();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell title="New bookmark">
      <FormSection title="Details">
        <BookmarkForm
          submitLabel="Create"
          isPending={create.isPending}
          error={error}
          onCancel={() => router.push("/bookmarks")}
          onSubmit={async (input) => {
            setError(null);
            try {
              const bookmark = await create.mutateAsync(input);
              router.push(`/bookmarks/${bookmark.id}`);
            } catch (err) {
              const message =
                (err as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Failed to save.";
              setError(message);
            }
          }}
        />
      </FormSection>
    </EntityListShell>
  );
}
