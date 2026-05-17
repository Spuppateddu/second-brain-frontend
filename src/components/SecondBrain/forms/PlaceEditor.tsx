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
  useCreatePlace,
  useDeletePlace,
  useUpdatePlace,
} from "@/lib/queries/entities";
import type { Place } from "@/types/entities";

interface PlaceEditorProps {
  mode: "modal" | "page";
  initial?: Place | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PlaceEditor(props: PlaceEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <PlaceEditorInner key={key} {...props} />;
}

function PlaceEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: PlaceEditorProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as Place & { is_searchable?: boolean })?.is_searchable ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreatePlace();
  const updateMut = useUpdatePlace(initial?.id ?? 0);
  const deleteMut = useDeletePlace();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!name.trim()) {
      setError("Place name is required.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim() || null,
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
          value={name}
          onChange={(v) => {
            setName(v);
            markDirty();
          }}
          placeholder={initial ? "Place name" : "New Place"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="place"
          id={initial?.id}
          entityLabel="place"
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
          <FormFieldLabel>URL / Maps link</FormFieldLabel>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              markDirty();
            }}
            placeholder="https://maps.google.com/..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <FormFieldLabel>Description</FormFieldLabel>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            placeholder="Optional notes about this place"
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
