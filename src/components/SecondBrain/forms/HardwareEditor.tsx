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
  useCreateHardware,
  useDeleteHardware,
  useUpdateHardware,
} from "@/lib/queries/entities";
import type { Hardware } from "@/types/entities";

interface HardwareEditorProps {
  mode: "modal" | "page";
  initial?: Hardware | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function HardwareEditor(props: HardwareEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <HardwareEditorInner key={key} {...props} />;
}

function HardwareEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: HardwareEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as Hardware & { is_searchable?: boolean })?.is_searchable ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateHardware();
  const updateMut = useUpdateHardware(initial?.id ?? 0);
  const deleteMut = useDeleteHardware();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("Hardware title is required.");
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
          placeholder={initial ? "Hardware title" : "New Hardware"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="hardware"
          id={initial?.id}
          entityLabel="hardware"
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
