"use client";

import { useState } from "react";

import EntityModalShell from "@/components/SecondBrain/EntityModalShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import SearchableToggle from "@/components/SecondBrain/SearchableToggle";
import {
  FooterCloseButton,
  FooterPrimaryButton,
  FormError,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useCreateNote, useUpdateNote } from "@/lib/queries/entities";
import type { Note } from "@/types/entities";

interface NoteFormModalProps {
  isOpen: boolean;
  initial?: Note | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function NoteFormModal(props: NoteFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <NoteFormModalInner key={key} {...props} />;
}

function NoteFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: NoteFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    initial?.is_searchable ?? true,
  );
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateNote();
  const updateMut = useUpdateNote(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const payload = {
      title: title.trim(),
      content,
      is_searchable: isSearchable,
      tags: tagIds,
    };
    try {
      if (initial) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
      onSaved?.();
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

  return (
    <EntityModalShell
      isOpen
      onClose={onClose}
      size="xl"
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={setTitle}
          placeholder={initial ? "Note title" : "New Note"}
        />
      }
      footer={
        <>
          <FooterCloseButton onClick={onClose} isPending={isPending} />
          <FooterPrimaryButton
            variant="secondary"
            onClick={() => submit(false)}
            isPending={isPending}
          >
            Save
          </FooterPrimaryButton>
          <FooterPrimaryButton
            onClick={() => submit(true)}
            isPending={isPending}
          >
            Save and Close
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write your note content here..."
        />
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
