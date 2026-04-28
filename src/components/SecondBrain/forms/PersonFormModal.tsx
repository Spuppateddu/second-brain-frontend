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
import { useCreatePerson, useUpdatePerson } from "@/lib/queries/entities";
import type { Person } from "@/types/entities";

interface PersonFormModalProps {
  isOpen: boolean;
  initial?: Person | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PersonFormModal(props: PersonFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <PersonFormModalInner key={key} {...props} />;
}

function PersonFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: PersonFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birth_date ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreatePerson();
  const updateMut = useUpdatePerson(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;
  void isSearchable;

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Person name is required.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      birth_date: birthDate || null,
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
          placeholder={initial ? "Person name" : "New Person"}
        />
      }
      footer={
        <>
          <FooterCloseButton onClick={onClose} isPending={isPending} />
          <FooterPrimaryButton onClick={submit} isPending={isPending}>
            {initial ? "Save" : "Create Person"}
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <FormFieldLabel>Birth date</FormFieldLabel>
          <input
            type="date"
            value={birthDate ?? ""}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <FormFieldLabel>Notes</FormFieldLabel>
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
