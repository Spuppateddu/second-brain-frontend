"use client";

import { useState } from "react";

import EntityActionBar from "@/components/SecondBrain/EntityActionBar";
import EntityEditorShell from "@/components/SecondBrain/EntityEditorShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import {
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import {
  useCreateMegaFile,
  useDeleteMegaFile,
  useUpdateMegaFile,
} from "@/lib/queries/entities";
import type { MegaFile } from "@/types/entities";

interface MegaFileEditorProps {
  mode: "modal" | "page";
  initial?: MegaFile | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function MegaFileEditor(props: MegaFileEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <MegaFileEditorInner key={key} {...props} />;
}

function MegaFileEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: MegaFileEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [megaLink, setMegaLink] = useState(initial?.mega_link ?? "");
  const [fileType, setFileType] = useState(initial?.file_type ?? "");
  const [fileSize, setFileSize] = useState(initial?.file_size ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isFolder, setIsFolder] = useState(initial?.is_folder ?? false);
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as MegaFile & { is_searchable?: boolean })?.is_searchable ?? true,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateMegaFile();
  const updateMut = useUpdateMegaFile(initial?.id ?? 0);
  const deleteMut = useDeleteMegaFile();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
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
      is_searchable: isSearchable,
      tag_ids: tagIds,
    };
    try {
      if (initial) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
      onSaved?.();
      setDirty(false);
      if (closeAfter) onClose();
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

  const handleDelete = initial
    ? async () => {
        try {
          await deleteMut.mutateAsync(initial.id);
          onClose();
        } catch (e: unknown) {
          const err = e as { response?: { data?: { message?: string } } };
          setError(err?.response?.data?.message ?? "Failed to delete.");
        }
      }
    : undefined;

  return (
    <EntityEditorShell
      mode={mode}
      onClose={onClose}
      belowBody={belowBody}
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={(v) => {
            setTitle(v);
            markDirty();
          }}
          placeholder={initial ? "File title" : "New Mega File"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="mega_file"
          id={initial?.id}
          entityLabel="file"
          dirty={dirty}
          isPending={isPending}
          isSearchable={{
            value: isSearchable,
            onChange: (v) => {
              setIsSearchable(v);
              markDirty();
            },
          }}
          onSave={() => submit(false)}
          onSaveAndExit={() => submit(true)}
          onDelete={handleDelete}
          onClose={mode === "modal" ? onClose : undefined}
        />
      }
    >
      <div className="space-y-4 pt-4">
        <div>
          <FormFieldLabel>Mega link</FormFieldLabel>
          <input
            type="url"
            value={megaLink}
            onChange={(e) => {
              setMegaLink(e.target.value);
              markDirty();
            }}
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
              onChange={(e) => {
                setFileType(e.target.value);
                markDirty();
              }}
              placeholder="zip, pdf, mp4..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <FormFieldLabel>File size</FormFieldLabel>
            <input
              type="text"
              value={fileSize ?? ""}
              onChange={(e) => {
                setFileSize(e.target.value);
                markDirty();
              }}
              placeholder="1.2 GB"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFolder}
            onChange={(e) => {
              setIsFolder(e.target.checked);
              markDirty();
            }}
          />
          This is a folder
        </label>
        <div>
          <FormFieldLabel>Description</FormFieldLabel>
          <textarea
            rows={3}
            value={description ?? ""}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <InlineTagPicker
          selectedTagIds={tagIds}
          onChange={(ids) => {
            setTagIds(ids);
            markDirty();
          }}
          prefillTagId={prefillTagId}
        />

        <FormError message={error} />
      </div>
    </EntityEditorShell>
  );
}
