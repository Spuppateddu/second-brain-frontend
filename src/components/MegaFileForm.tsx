"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

import { TagPicker } from "@/components/TagPicker";
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

  const valid =
    title.trim().length > 0 && megaLink.trim().length > 0;

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
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Title <span className="text-danger">*</span>
        </span>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          MEGA link <span className="text-danger">*</span>
        </span>
        <Input
          type="url"
          placeholder="https://mega.nz/…"
          value={megaLink}
          onChange={(e) => setMegaLink(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            File type
          </span>
          <Input
            type="text"
            placeholder="zip, pdf, mp4 …"
            value={fileType ?? ""}
            onChange={(e) => setFileType(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            File size
          </span>
          <Input
            type="text"
            placeholder="120 MB"
            value={fileSize ?? ""}
            onChange={(e) => setFileSize(e.target.value)}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFolder}
          onChange={(e) => setIsFolder(e.target.checked)}
        />
        <span>This link points to a folder</span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Description
        </span>
        <textarea
          className="min-h-[100px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <TagPicker value={tagIds} onChange={setTagIds} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isDisabled={!valid || isPending}
        >
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
