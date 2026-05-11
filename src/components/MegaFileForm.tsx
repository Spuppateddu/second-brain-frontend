"use client";

import { useState } from "react";

import { TagPicker } from "@/components/TagPicker";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Textarea } from "@/components/UI/Textarea";
import type { MegaFileInput } from "@/lib/queries/entities";
import type { MegaFile } from "@/types/entities";

type Props = {
  initial?: MegaFile;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: MegaFileInput) => Promise<void>;
};

export function MegaFileForm({
  initial,
  submitLabel,
  isPending,
  error,
  onCancel,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [megaLink, setMegaLink] = useState(initial?.mega_link ?? "");
  const [fileType, setFileType] = useState(initial?.file_type ?? "");
  const [fileSize, setFileSize] = useState(initial?.file_size ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isFolder, setIsFolder] = useState(initial?.is_folder ?? false);
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );

  const valid = title.trim().length > 0 && megaLink.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        await onSubmit({
          title: title.trim(),
          mega_link: megaLink.trim(),
          file_type: fileType.trim() || null,
          file_size: fileSize.trim() || null,
          description: description.trim() || null,
          is_folder: isFolder,
          tag_ids: tagIds,
        });
      }}
    >
      <Input
        label="Title *"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        isFocused
        fullWidth
      />
      <Input
        label="MEGA link *"
        type="url"
        placeholder="https://mega.nz/…"
        value={megaLink}
        onChange={(e) => setMegaLink(e.target.value)}
        fullWidth
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="File type"
          type="text"
          placeholder="zip, pdf, mp4 …"
          value={fileType ?? ""}
          onChange={(e) => setFileType(e.target.value)}
          fullWidth
        />
        <Input
          label="File size"
          type="text"
          placeholder="120 MB"
          value={fileSize ?? ""}
          onChange={(e) => setFileSize(e.target.value)}
          fullWidth
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
        <input
          type="checkbox"
          checked={isFolder}
          onChange={(e) => setIsFolder(e.target.checked)}
          className="h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
        />
        <span>This link points to a folder</span>
      </label>
      <Textarea
        label="Description"
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
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!valid || isPending}
          loading={isPending}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
