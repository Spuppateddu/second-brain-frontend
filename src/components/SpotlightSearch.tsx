"use client";

import { Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  useSecondBrainSearch,
  type SearchResult,
} from "@/lib/queries/entities";

const TYPE_COLORS: Record<string, string> = {
  note: "#3b82f6",
  bookmark: "#10b981",
  recipe: "#f97316",
  wishlist_item: "#ec4899",
  place: "#8b5cf6",
  person: "#06b6d4",
  bag: "#84cc16",
  hardware: "#f59e0b",
  software: "#a855f7",
  mega_file: "#64748b",
  trip: "#14b8a6",
  tag: "#475569",
};

const ENTITY_HREF: Record<string, (id: number) => string> = {
  note: (id) => `/notes/${id}`,
  bookmark: (id) => `/bookmarks/${id}`,
  recipe: (id) => `/recipes/${id}`,
  wishlist_item: (id) => `/wishlist/${id}`,
  place: (id) => `/places/${id}`,
  person: (id) => `/persons/${id}`,
  bag: (id) => `/bags/${id}`,
  hardware: (id) => `/hardware/${id}`,
  software: (id) => `/software/${id}`,
  mega_file: (id) => `/mega-files/${id}`,
  trip: (id) => `/trips/${id}`,
  tag: () => "/tags",
};

function hrefFor(result: SearchResult): string {
  const fn = ENTITY_HREF[result.type];
  return fn ? fn(result.id) : "/second-brain";
}

type SpotlightSearchProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export function SpotlightSearch({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: SpotlightSearchProps = {}) {
  const router = useRouter();
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const search = useSecondBrainSearch(query);
  const results = search.data ?? [];

  // Cmd+K / Ctrl+K toggles, Escape closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus input when modal opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) {
    if (!showTrigger) return null;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900 md:flex"
      >
        <span>Search</span>
        <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 text-[10px] dark:border-zinc-700 dark:bg-zinc-900">
          ⌘K
        </kbd>
      </button>
    );
  }

  function pick(r: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(hrefFor(r));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="mt-24 w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search notes, bookmarks, places, people…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlighted((h) =>
                  Math.min(results.length - 1, h + 1),
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlighted((h) => Math.max(0, h - 1));
              } else if (e.key === "Enter") {
                const r = results[highlighted];
                if (r) pick(r);
              }
            }}
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="p-4 text-center text-xs text-zinc-500">
              Type at least 2 characters to search.
            </p>
          ) : search.isLoading ? (
            <p className="p-4 text-center text-xs text-zinc-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500">No matches.</p>
          ) : (
            <ul className="flex flex-col">
              {results.map((r, i) => {
                const color = TYPE_COLORS[r.type] ?? "#94a3b8";
                const active = i === highlighted;
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => pick(r)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={[
                        "flex w-full items-start gap-3 px-3 py-2 text-left text-sm",
                        active
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                      ].join(" ")}
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">
                          {r.title}
                        </span>
                        {r.subtitle ? (
                          <span className="block truncate text-xs text-zinc-500">
                            {r.subtitle}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                        {r.type_label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-1.5 text-[10px] text-zinc-500 dark:border-zinc-800">
          <span>↑↓ to navigate · ⏎ to open · Esc to close</span>
          <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}
