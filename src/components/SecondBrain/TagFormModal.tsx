"use client";

import { Button, Input } from "@heroui/react";
import { useEffect, useState } from "react";

import type { Tag } from "@/types/entities";

interface TagFormModalProps {
  isOpen: boolean;
  initial?: Tag | null;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: TagFormValues) => Promise<void> | void;
}

export default function TagFormModal(props: TagFormModalProps) {
  // Re-key the inner form on tag identity / open transitions so the form's
  // useState defaults pick up the new initial values without setState-in-effect.
  if (!props.isOpen) return null;
  const initialKey = props.initial ? `tag-${props.initial.id}` : "new";
  return <TagFormModalInner key={initialKey} {...props} />;
}

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#A855F7",
  "#64748B",
  "#14B8A6",
  "#EF4444",
];

export interface TagFormValues {
  name: string;
  color: string;
  description: string;
  is_searchable: boolean;
}

function TagFormModalInner({
  initial,
  isPending,
  error,
  onClose,
  onSubmit,
}: TagFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isSearchable, setIsSearchable] = useState(
    initial?.is_searchable ?? true,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={() => !isPending && onClose()}
    >
      <div
        className="mt-20 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold">
            {initial ? "Edit tag" : "New tag"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Pick ${c}`}
                  onClick={() => setColor(c)}
                  className={[
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color.toLowerCase() === c.toLowerCase()
                      ? "scale-110 border-zinc-900 dark:border-white"
                      : "border-transparent hover:scale-105",
                  ].join(" ")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isSearchable}
              onChange={(e) => setIsSearchable(e.target.checked)}
            />
            Searchable in spotlight
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            isDisabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isDisabled={!name.trim() || isPending}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                color,
                description: description.trim(),
                is_searchable: isSearchable,
              })
            }
          >
            {isPending ? "Saving…" : initial ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
