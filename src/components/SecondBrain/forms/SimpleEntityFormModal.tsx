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

interface MutationLike<TPayload> {
  isPending: boolean;
  mutateAsync: (payload: TPayload) => Promise<unknown>;
}

interface SimpleEntityFormModalProps<
  T extends { id: number },
  TPayload extends Record<string, unknown>,
> {
  isOpen: boolean;
  initial?: T | null;
  prefillTagId?: number;
  /** Display name for the entity, e.g. "Bag", "Hardware". */
  entityLabel: string;
  /** Field on the entity that holds its display title — usually `title` or `name`. */
  titleField: "title" | "name";
  onClose: () => void;
  onSaved?: () => void;
  createMutation: MutationLike<TPayload>;
  updateMutation: MutationLike<TPayload>;
}

export default function SimpleEntityFormModal<
  T extends { id: number },
  TPayload extends Record<string, unknown>,
>(props: SimpleEntityFormModalProps<T, TPayload>) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <SimpleEntityFormModalInner key={key} {...props} />;
}

function SimpleEntityFormModalInner<
  T extends { id: number },
  TPayload extends Record<string, unknown>,
>({
  initial,
  prefillTagId,
  entityLabel,
  titleField,
  onClose,
  onSaved,
  createMutation,
  updateMutation,
}: SimpleEntityFormModalProps<T, TPayload>) {
  // We treat initial as "anything with id, plus the optional title/name/description/tags"
  const init = initial as
    | (T & {
        title?: string;
        name?: string;
        description?: string | null;
        tags?: { id: number }[];
      })
    | null
    | undefined;

  const [title, setTitle] = useState(
    init?.[titleField] != null ? String(init[titleField]) : "",
  );
  const [description, setDescription] = useState(init?.description ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    init?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError(`${entityLabel} ${titleField} is required.`);
      return;
    }
    const payload = {
      [titleField]: title.trim(),
      description: description.trim() || null,
      tag_ids: tagIds,
    } as unknown as TPayload;
    try {
      if (initial) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
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

  // Prevent the unused-prop lint by reading isSearchable into the form for future use.
  void isSearchable;

  return (
    <EntityModalShell
      isOpen
      onClose={onClose}
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={setTitle}
          placeholder={initial ? `${entityLabel} ${titleField}` : `New ${entityLabel}`}
        />
      }
      footer={
        <>
          <FooterCloseButton onClick={onClose} isPending={isPending} />
          <FooterPrimaryButton onClick={submit} isPending={isPending}>
            {initial ? "Save" : `Create ${entityLabel}`}
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <FormFieldLabel>Description</FormFieldLabel>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
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
