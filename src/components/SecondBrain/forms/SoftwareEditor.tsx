"use client";

import { useState } from "react";

import { RichTextEditor } from "@/components/RichTextEditor";
import EntityActionBar from "@/components/SecondBrain/EntityActionBar";
import EntityEditorShell from "@/components/SecondBrain/EntityEditorShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import {
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import {
  useCreateSoftware,
  useDeleteSoftware,
  useUpdateSoftware,
} from "@/lib/queries/entities";
import type { Software } from "@/types/entities";

interface SoftwareEditorProps {
  mode: "modal" | "page";
  initial?: Software | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SoftwareEditor(props: SoftwareEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <SoftwareEditorInner key={key} {...props} />;
}

function SoftwareEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: SoftwareEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as Software & { is_searchable?: boolean })?.is_searchable ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateSoftware();
  const updateMut = useUpdateSoftware(initial?.id ?? 0);
  const deleteMut = useDeleteSoftware();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("Software title is required.");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
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
          placeholder={initial ? "Software title" : "New Software"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="software"
          id={initial?.id}
          entityLabel="software"
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
          <FormFieldLabel>Description</FormFieldLabel>
          <RichTextEditor
            value={description ?? ""}
            onChange={(v) => {
              setDescription(v);
              markDirty();
            }}
            placeholder="Optional"
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
