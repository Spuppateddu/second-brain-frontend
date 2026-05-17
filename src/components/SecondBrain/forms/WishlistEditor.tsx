"use client";

import { useState } from "react";
import { HiCheckCircle, HiOutlineCheckCircle } from "react-icons/hi2";

import EntityActionBar from "@/components/SecondBrain/EntityActionBar";
import EntityEditorShell from "@/components/SecondBrain/EntityEditorShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import {
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import {
  useCreateWishlist,
  useDeleteWishlist,
  useUpdateWishlist,
} from "@/lib/queries/entities";
import type { WishlistItem } from "@/types/entities";

interface WishlistEditorProps {
  mode: "modal" | "page";
  initial?: WishlistItem | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function WishlistEditor(props: WishlistEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <WishlistEditorInner key={key} {...props} />;
}

function WishlistEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: WishlistEditorProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [price, setPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : "",
  );
  const [plannedDate, setPlannedDate] = useState(
    initial?.planned_purchase_date ?? "",
  );
  const [isPurchased, setIsPurchased] = useState(initial?.is_purchased ?? false);
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as WishlistItem & { is_searchable?: boolean })?.is_searchable ??
      false,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateWishlist();
  const updateMut = useUpdateWishlist(initial?.id ?? 0);
  const deleteMut = useDeleteWishlist();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!name.trim()) {
      setError("Wishlist item name is required.");
      return;
    }
    const payload = {
      name: name.trim(),
      link: link.trim() || null,
      notes: notes.trim() || null,
      price: price.trim() === "" ? null : Number(price),
      planned_purchase_date: plannedDate || null,
      is_purchased: isPurchased,
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
          placeholder={initial ? "Wishlist item name" : "New Wishlist Item"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="wishlist_item"
          id={initial?.id}
          entityLabel="wishlist item"
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
          <FormFieldLabel>Link</FormFieldLabel>
          <input
            type="url"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              markDirty();
            }}
            placeholder="https://example.com/product"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormFieldLabel>Price</FormFieldLabel>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                markDirty();
              }}
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <FormFieldLabel>Planned Purchase Date</FormFieldLabel>
            <input
              type="date"
              value={plannedDate ?? ""}
              onChange={(e) => {
                setPlannedDate(e.target.value);
                markDirty();
              }}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <FormFieldLabel>Notes</FormFieldLabel>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              markDirty();
            }}
            placeholder="Why do you want this?"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {initial && (
          <button
            type="button"
            onClick={() => {
              setIsPurchased((v) => !v);
              markDirty();
            }}
            className={[
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              isPurchased
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
            ].join(" ")}
          >
            {isPurchased ? (
              <HiCheckCircle className="h-5 w-5" />
            ) : (
              <HiOutlineCheckCircle className="h-5 w-5" />
            )}
            {isPurchased ? "Marked as bought" : "Mark as bought"}
          </button>
        )}

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
