"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiArrowLongLeft } from "react-icons/hi2";

import { RichTextEditor } from "@/components/RichTextEditor";
import { TagPicker } from "@/components/TagPicker";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
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
    <main className="flex flex-col gap-4 p-4 sm:p-6 lg:py-10">
      <header className="flex items-center justify-between">
        <Link href="/notes">
          <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
            Back to notes
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          disabled={!title.trim() || create.isPending}
          loading={create.isPending}
          onClick={save}
        >
          Create
        </Button>
      </header>

      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
      />

      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Write your first paragraph…"
      />

      <TagPicker value={tagIds} onChange={setTagIds} />

      {error ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}
    </main>
  );
}
