"use client";

import { useState } from "react";
import { HiPlus, HiX } from "react-icons/hi";

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
import { RichTextEditor } from "@/components/RichTextEditor";
import { useCreateTrip, useUpdateTrip } from "@/lib/queries/entities";
import type { Trip } from "@/types/entities";

interface TripFormModalProps {
  isOpen: boolean;
  initial?: Trip | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function TripFormModal(props: TripFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <TripFormModalInner key={key} {...props} />;
}

type SectionProps = {
  label: string;
  addLabel: string;
  value: string;
  placeholder: string;
  onChange: (html: string) => void;
};

function ExpandableRichTextSection({
  label,
  addLabel,
  value,
  placeholder,
  onChange,
}: SectionProps) {
  const [open, setOpen] = useState(() => !!value && value.trim() !== "");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-left text-sm text-zinc-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-primary-900/20"
      >
        <HiPlus className="h-4 w-4" />
        <span>{addLabel}</span>
      </button>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <FormFieldLabel>{label}</FormFieldLabel>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onChange("");
          }}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label={`Remove ${label}`}
        >
          <HiX className="h-4 w-4" />
        </button>
      </div>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

function TripFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: TripFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [locations, setLocations] = useState(initial?.locations ?? "");
  const [bag, setBag] = useState(initial?.bag ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateTrip();
  const updateMut = useUpdateTrip(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!name.trim()) {
      setError("Trip name is required.");
      return;
    }
    const payload = {
      name: name.trim(),
      notes: notes.trim() || null,
      locations: locations.trim() || null,
      bag: bag.trim() || null,
      is_searchable: isSearchable,
      tag_ids: tagIds,
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
          value={name}
          onChange={setName}
          placeholder={initial ? "Trip name" : "New Trip"}
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
      <div className="space-y-4">
        <ExpandableRichTextSection
          label="Notes"
          addLabel="Add Notes"
          value={notes}
          placeholder="Additional trip notes..."
          onChange={setNotes}
        />

        <ExpandableRichTextSection
          label="Places to Visit"
          addLabel="Add Places to Visit"
          value={locations}
          placeholder="List of places to visit..."
          onChange={setLocations}
        />

        <ExpandableRichTextSection
          label="What to Pack (Bag)"
          addLabel="Add Packing List"
          value={bag}
          placeholder="List of things to pack for the trip..."
          onChange={setBag}
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
