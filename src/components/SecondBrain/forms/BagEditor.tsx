"use client";

import { useState } from "react";
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi2";

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
  useCreateBag,
  useDeleteBag,
  useUpdateBag,
} from "@/lib/queries/entities";
import type { Bag } from "@/types/entities";

interface BagEditorProps {
  mode: "modal" | "page";
  initial?: Bag | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function BagEditor(props: BagEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <BagEditorInner key={key} {...props} />;
}

function BagEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: BagEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false);
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as Bag & { is_searchable?: boolean })?.is_searchable ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateBag();
  const updateMut = useUpdateBag(initial?.id ?? 0);
  const deleteMut = useDeleteBag();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("Bag title is required.");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      is_default: isDefault,
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
          placeholder={initial ? "Bag title" : "New Bag"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="bag"
          id={initial?.id}
          entityLabel="bag"
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsDefault(!isDefault);
              markDirty();
            }}
            className={[
              "rounded-lg p-2 transition-colors",
              isDefault
                ? "bg-amber-100 text-amber-500 dark:bg-amber-900/30"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
            ].join(" ")}
          >
            {isDefault ? (
              <HiBookmark className="h-5 w-5" />
            ) : (
              <HiOutlineBookmark className="h-5 w-5" />
            )}
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {isDefault
              ? "Default bag (available to copy into trips)"
              : "Not a default bag"}
          </span>
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
