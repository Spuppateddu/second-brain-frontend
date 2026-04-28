"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

import { TagPicker } from "@/components/TagPicker";
import type { BookmarkInput } from "@/lib/queries/entities";
import type { Bookmark } from "@/types/entities";

type Props = {
  initial?: Bookmark;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: BookmarkInput) => Promise<void>;
};

export function BookmarkForm({
  initial,
  submitLabel,
  isPending,
  error,
  onCancel,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );

  const valid = title.trim().length > 0 && /^https?:\/\//i.test(url.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    await onSubmit({
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || null,
      tag_ids: tagIds,
    });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Input
        type="url"
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <textarea
        className="min-h-[100px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        placeholder="Description (optional)"
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
      />
      <TagPicker value={tagIds} onChange={setTagIds} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isDisabled={!valid || isPending}
        >
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
