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
import { useCreatePlace, useUpdatePlace } from "@/lib/queries/entities";
import type { Place } from "@/types/entities";

interface PlaceFormModalProps {
  isOpen: boolean;
  initial?: Place | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PlaceFormModal(props: PlaceFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <PlaceFormModalInner key={key} {...props} />;
}

function PlaceFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: PlaceFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreatePlace();
  const updateMut = useUpdatePlace(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;
  void isSearchable;

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Place name is required.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim() || null,
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
          value={name}
          onChange={setName}
          placeholder={initial ? "Place name" : "New Place"}
        />
      }
      footer={
        <>
          <FooterCloseButton onClick={onClose} isPending={isPending} />
          <FooterPrimaryButton onClick={submit} isPending={isPending}>
            {initial ? "Save" : "Create Place"}
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <FormFieldLabel>URL / Maps link</FormFieldLabel>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <FormFieldLabel>Description</FormFieldLabel>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this place"
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
