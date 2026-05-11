"use client";

import { useState } from "react";

import { TagPicker } from "@/components/TagPicker";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Textarea } from "@/components/UI/Textarea";
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
        label="Title *"
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        isFocused
        fullWidth
      />
      <Input
        label="URL *"
        type="url"
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
      />
      <Textarea
        label="Description"
        placeholder="Description (optional)"
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[100px]"
        fullWidth
      />
      <TagPicker value={tagIds} onChange={setTagIds} />
      {error ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={!valid || isPending}
          loading={isPending}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
