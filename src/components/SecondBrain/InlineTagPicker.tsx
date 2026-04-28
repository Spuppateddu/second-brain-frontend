"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiPlus, HiXMark } from "react-icons/hi2";

import { useCreateTag, useTags } from "@/lib/queries/entities";
import type { Tag } from "@/types/entities";

const RANDOM_TAG_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
];

interface InlineTagPickerProps {
  selectedTagIds: number[];
  onChange: (ids: number[]) => void;
  prefillTagId?: number;
}

export default function InlineTagPicker({
  selectedTagIds,
  onChange,
  prefillTagId,
}: InlineTagPickerProps) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const prefillAppliedRef = useRef(false);

  // Pull in the tag the user clicked "+ New" from (if any) the first time
  // we see a non-zero prefill. Subsequent renders leave the selection alone.
  useEffect(() => {
    if (prefillAppliedRef.current) return;
    if (prefillTagId == null) return;
    if (selectedTagIds.includes(prefillTagId)) return;
    if (!tags.some((t) => t.id === prefillTagId)) return;
    prefillAppliedRef.current = true;
    onChange([...selectedTagIds, prefillTagId]);
  }, [prefillTagId, selectedTagIds, tags, onChange]);

  useEffect(() => {
    if (!open || !inputWrapperRef.current) return;
    const update = () => {
      const rect = inputWrapperRef.current!.getBoundingClientRect();
      setPos({ top: rect.bottom, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !dropdownRef.current?.contains(t) &&
        !inputWrapperRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = useMemo(
    () => tags.filter((t) => selectedTagIds.includes(t.id)),
    [tags, selectedTagIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, query]);

  const showCreateOption =
    query.trim() !== "" &&
    !tags.some((t) => t.name.toLowerCase() === query.toLowerCase().trim());

  const toggle = (tag: Tag) => {
    if (selectedTagIds.includes(tag.id)) {
      onChange(selectedTagIds.filter((id) => id !== tag.id));
    } else {
      onChange([...selectedTagIds, tag.id]);
    }
  };

  const remove = (tagId: number) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const createAndSelect = async () => {
    const name = query.trim();
    if (!name) return;
    const existing = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      if (!selectedTagIds.includes(existing.id))
        onChange([...selectedTagIds, existing.id]);
      setQuery("");
      setOpen(false);
      return;
    }
    try {
      const color =
        RANDOM_TAG_COLORS[Math.floor(Math.random() * RANDOM_TAG_COLORS.length)];
      const created = await createTag.mutateAsync({ name, color });
      onChange([...selectedTagIds, created.id]);
      setQuery("");
      setOpen(false);
    } catch (e) {
      console.error("Failed to create tag", e);
    }
  };

  return (
    <div>
      <span className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
        Tags
      </span>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => remove(tag.id)}
                className="rounded-full p-0.5 hover:bg-white/20"
                aria-label="Remove tag"
              >
                <HiXMark className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={inputWrapperRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (showCreateOption) void createAndSelect();
            }
          }}
          placeholder="Search or create tags..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] max-h-60 overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {filtered.length > 0 ? (
              filtered.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    toggle(tag);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center gap-2 px-4 py-2 text-left text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700",
                    selectedTagIds.includes(tag.id)
                      ? "bg-zinc-50 dark:bg-zinc-700/60"
                      : "",
                  ].join(" ")}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate">{tag.name}</span>
                  {selectedTagIds.includes(tag.id) && (
                    <span className="ml-auto text-sm text-sky-600 dark:text-sky-400">
                      Selected
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-zinc-500">
                No tags found
              </div>
            )}
            {showCreateOption && (
              <button
                type="button"
                onClick={() => void createAndSelect()}
                className="flex w-full items-center gap-2 border-t border-zinc-100 px-4 py-2 text-left font-medium text-sky-700 hover:bg-sky-50 dark:border-zinc-700 dark:text-sky-300 dark:hover:bg-sky-900/30"
              >
                <HiPlus className="h-4 w-4" />
                <span>Create &ldquo;{query.trim()}&rdquo;</span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
