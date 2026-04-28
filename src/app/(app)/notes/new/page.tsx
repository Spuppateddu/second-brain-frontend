"use client";

import { Button, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RichTextEditor } from "@/components/RichTextEditor";
import { TagPicker } from "@/components/TagPicker";
import { useCreateNote } from "@/lib/queries/entities";

export default function NewNotePage() {
  const router = useRouter();
  const create = useCreateNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    try {
      const note = await create.mutateAsync({
        title,
        content,
        tags: tagIds,
      });
      router.push(`/notes/${note.id}`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(message);
    }
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/notes")}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to notes
        </button>
        <Button
          variant="primary"
          size="sm"
          isDisabled={!title.trim() || create.isPending}
          onClick={save}
        >
          {create.isPending ? "Saving…" : "Create"}
        </Button>
      </div>
      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Write your first paragraph…"
      />
      <TagPicker value={tagIds} onChange={setTagIds} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </main>
  );
}
