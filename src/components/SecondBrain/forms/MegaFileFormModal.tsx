"use client";

import { useState } from "react";

import EntityModalShell from "@/components/SecondBrain/EntityModalShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import SearchableToggle from "@/components/SecondBrain/SearchableToggle";
import {
  FooterCloseButton,
  FooterPrimaryButton,
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import { useCreateMegaFile, useUpdateMegaFile } from "@/lib/queries/entities";
import type { MegaFile } from "@/types/entities";

interface MegaFileFormModalProps {
  isOpen: boolean;
  initial?: MegaFile | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function MegaFileFormModal(props: MegaFileFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <MegaFileFormModalInner key={key} {...props} />;
}

function MegaFileFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: MegaFileFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [megaLink, setMegaLink] = useState(initial?.mega_link ?? "");
  const [fileType, setFileType] = useState(initial?.file_type ?? "");
  const [fileSize, setFileSize] = useState(initial?.file_size ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isFolder, setIsFolder] = useState(initial?.is_folder ?? false);
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateMegaFile();
  const updateMut = useUpdateMegaFile(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;
  void isSearchable;

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("File title is required.");
      return;
    }
    if (!megaLink.trim()) {
      setError("Mega link is required.");
      return;
    }
    const payload = {
      title: title.trim(),
      mega_link: megaLink.trim(),
      file_type: fileType.trim() || null,
      file_size: fileSize.trim() || null,
      description: description.trim() || null,
      is_folder: isFolder,
      tag_ids: tagIds,
    };
    try {
      if (initial) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to save.",
      );
    }
  };

  return (
    <EntityModalShell
      isOpen
      onClose={onClose}
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={setTitle}
          placeholder={initial ? "File title" : "New Mega File"}
        />
      }
      footer={
        <>
          <FooterCloseButton onClick={onClose} isPending={isPending} />
          <FooterPrimaryButton onClick={submit} isPending={isPending}>
            {initial ? "Save" : "Create File"}
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="space-y-4 pt-4">
        <div>
          <FormFieldLabel>Mega link</FormFieldLabel>
          <input
            type="url"
            value={megaLink}
            onChange={(e) => setMegaLink(e.target.value)}
            placeholder="https://mega.nz/..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormFieldLabel>File type</FormFieldLabel>
            <input
              type="text"
              value={fileType ?? ""}
              onChange={(e) => setFileType(e.target.value)}
              placeholder="zip, pdf, mp4..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <FormFieldLabel>File size</FormFieldLabel>
            <input
              type="text"
              value={fileSize ?? ""}
              onChange={(e) => setFileSize(e.target.value)}
              placeholder="1.2 GB"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFolder}
            onChange={(e) => setIsFolder(e.target.checked)}
          />
          This is a folder
        </label>
        <div>
          <FormFieldLabel>Description</FormFieldLabel>
          <textarea
            rows={3}
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <InlineTagPicker
          selectedTagIds={tagIds}
          onChange={setTagIds}
          prefillTagId={prefillTagId}
        />

        <SearchableToggle value={isSearchable} onChange={setIsSearchable} />

        <FormError message={error} />
      </div>
    </EntityModalShell>
  );
}
