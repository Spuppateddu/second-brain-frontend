"use client";

import { useState } from "react";
import { HiPlus } from "react-icons/hi2";

import { RichTextEditor } from "@/components/RichTextEditor";
import {
  EditorGroupProvider,
  SharedEditorToolbar,
} from "@/components/RichTextEditorGroup";
import EntityActionBar from "@/components/SecondBrain/EntityActionBar";
import EntityEditorShell from "@/components/SecondBrain/EntityEditorShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import CopyFromBagPicker from "@/components/SecondBrain/forms/CopyFromBagPicker";
import {
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import {
  useCreateTrip,
  useDeleteTrip,
  useUpdateTrip,
} from "@/lib/queries/entities";
import type { Trip } from "@/types/entities";

function isHtmlEmpty(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

interface TripEditorProps {
  mode: "modal" | "page";
  initial?: Trip | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function TripEditor(props: TripEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <TripEditorInner key={key} {...props} />;
}

type SectionProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (html: string) => void;
  headerExtra?: React.ReactNode;
};

function TripSection({
  label,
  value,
  placeholder,
  onChange,
  headerExtra,
}: SectionProps) {
  const [expanded, setExpanded] = useState(() => !isHtmlEmpty(value));

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-left hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <HiPlus className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </button>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <FormFieldLabel>{label}</FormFieldLabel>
        {headerExtra}
      </div>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

function TripEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: TripEditorProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bag, setBag] = useState(initial?.bag ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [planWithoutTime, setPlanWithoutTime] = useState(
    initial?.plan_without_time ?? "",
  );
  const [plan, setPlan] = useState(initial?.plan ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as Trip & { is_searchable?: boolean })?.is_searchable ?? true,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateTrip();
  const updateMut = useUpdateTrip(initial?.id ?? 0);
  const deleteMut = useDeleteTrip();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!name.trim()) {
      setError("Trip name is required.");
      return;
    }
    const payload = {
      name: name.trim(),
      bag: bag.trim() || null,
      notes: notes.trim() || null,
      plan_without_time: planWithoutTime.trim() || null,
      plan: plan.trim() || null,
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
      size="xl"
      onClose={onClose}
      belowBody={belowBody}
      titleContent={
        <ModalTitleInput
          value={name}
          onChange={(v) => {
            setName(v);
            markDirty();
          }}
          placeholder={initial ? "Trip name" : "New Trip"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="trip"
          id={initial?.id}
          entityLabel="trip"
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
      <EditorGroupProvider>
        <SharedEditorToolbar className="-mx-4 mb-4 border-b border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-950" />
        <div className="space-y-4 pt-2">
          <TripSection
            label="Plan without time"
            value={planWithoutTime}
            placeholder="Things to do / places to visit, no schedule…"
            onChange={(v) => {
              setPlanWithoutTime(v);
              markDirty();
            }}
          />

          <TripSection
            label="Plan"
            value={plan}
            placeholder="Timed itinerary…"
            onChange={(v) => {
              setPlan(v);
              markDirty();
            }}
          />

          <TripSection
            label="Notes"
            value={notes}
            placeholder="Additional trip notes…"
            onChange={(v) => {
              setNotes(v);
              markDirty();
            }}
          />

          <TripSection
            label="Bag"
            value={bag}
            placeholder="What to pack…"
            onChange={(v) => {
              setBag(v);
              markDirty();
            }}
            headerExtra={
              <CopyFromBagPicker
                currentValue={bag}
                onPicked={(v) => {
                  setBag(v);
                  markDirty();
                }}
              />
            }
          />

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
      </EditorGroupProvider>
    </EntityEditorShell>
  );
}
