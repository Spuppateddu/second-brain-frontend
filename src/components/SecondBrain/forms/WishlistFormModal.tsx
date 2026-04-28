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
import { useCreateWishlist, useUpdateWishlist } from "@/lib/queries/entities";
import type { WishlistItem } from "@/types/entities";

interface WishlistFormModalProps {
  isOpen: boolean;
  initial?: WishlistItem | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function WishlistFormModal(props: WishlistFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <WishlistFormModalInner key={key} {...props} />;
}

function WishlistFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: WishlistFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateWishlist();
  const updateMut = useUpdateWishlist(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;
  void isSearchable;

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Wishlist item name is required.");
      return;
    }
    const payload = {
      name: name.trim(),
      link: link.trim() || null,
      notes: notes.trim() || null,
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
          placeholder={initial ? "Wishlist item name" : "New Wishlist Item"}
        />
      }
      footer={
        <>
          <FooterCloseButton onClick={onClose} isPending={isPending} />
          <FooterPrimaryButton onClick={submit} isPending={isPending}>
            {initial ? "Save" : "Create Wishlist Item"}
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <FormFieldLabel>Link</FormFieldLabel>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <FormFieldLabel>Notes</FormFieldLabel>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why do you want this?"
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
