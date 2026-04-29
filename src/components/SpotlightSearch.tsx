"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBookmark,
  FaBriefcase,
  FaCloud,
  FaCopy,
  FaExpand,
  FaExternalLinkAlt,
  FaGift,
  FaLaptopCode,
  FaMapMarkerAlt,
  FaMicrochip,
  FaPlane,
  FaSearch,
  FaStickyNote,
  FaTag,
  FaTimes,
  FaUser,
  FaUtensils,
} from "react-icons/fa";

import { useEntityModals } from "@/components/SecondBrain/EntityModalsProvider";
import { api } from "@/lib/api";
import {
  useSecondBrainSearch,
  type SearchResult,
} from "@/lib/queries/entities";
import type { GraphNodeKind } from "@/types/graph";

type SectionConfig = {
  type: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string; // tailwind bg-* class for the icon tile
  fullPagePath: (id: number) => string;
};

const SECTIONS: SectionConfig[] = [
  { type: "tag", label: "Tags", Icon: FaTag, color: "bg-purple-500", fullPagePath: () => "/tags" },
  { type: "bookmark", label: "Bookmarks", Icon: FaBookmark, color: "bg-blue-500", fullPagePath: (id) => `/bookmarks/${id}` },
  { type: "note", label: "Notes", Icon: FaStickyNote, color: "bg-yellow-500", fullPagePath: (id) => `/notes/${id}` },
  { type: "recipe", label: "Recipes", Icon: FaUtensils, color: "bg-green-500", fullPagePath: (id) => `/recipes/${id}` },
  { type: "wishlist_item", label: "Wishlist", Icon: FaGift, color: "bg-pink-500", fullPagePath: (id) => `/wishlist/${id}` },
  { type: "place", label: "Places", Icon: FaMapMarkerAlt, color: "bg-red-500", fullPagePath: (id) => `/places/${id}` },
  { type: "person", label: "People", Icon: FaUser, color: "bg-indigo-500", fullPagePath: (id) => `/persons/${id}` },
  { type: "bag", label: "Bags", Icon: FaBriefcase, color: "bg-orange-500", fullPagePath: (id) => `/bags/${id}` },
  { type: "hardware", label: "Hardware", Icon: FaMicrochip, color: "bg-teal-500", fullPagePath: (id) => `/hardware/${id}` },
  { type: "software", label: "Software", Icon: FaLaptopCode, color: "bg-cyan-500", fullPagePath: (id) => `/software/${id}` },
  { type: "mega_file", label: "Mega Files", Icon: FaCloud, color: "bg-red-500", fullPagePath: (id) => `/mega-files/${id}` },
  { type: "trip", label: "Trips", Icon: FaPlane, color: "bg-emerald-500", fullPagePath: (id) => `/trips/${id}` },
];

const SECTION_BY_TYPE: Record<string, SectionConfig> = SECTIONS.reduce(
  (acc, s) => {
    acc[s.type] = s;
    return acc;
  },
  {} as Record<string, SectionConfig>,
);

// Endpoint shape used to fetch the full entity behind a search hit so it can
// be passed to EntityModalsProvider's openEdit. Keys mirror /api/v1 routes.
const FETCH_BY_TYPE: Record<string, { url: (id: number) => string; key?: string }> = {
  bookmark: { url: (id) => `/bookmarks/${id}`, key: "bookmark" },
  note: { url: (id) => `/notes/${id}`, key: "note" },
  recipe: { url: (id) => `/recipes/${id}`, key: "recipe" },
  wishlist_item: { url: (id) => `/wishlist/${id}`, key: "item" },
  place: { url: (id) => `/places/${id}`, key: "place" },
  person: { url: (id) => `/persons/${id}`, key: "person" },
  bag: { url: (id) => `/bags/${id}`, key: "bag" },
  hardware: { url: (id) => `/hardware/${id}`, key: "hardware" },
  software: { url: (id) => `/software/${id}`, key: "software" },
  trip: { url: (id) => `/trips/${id}`, key: "trip" },
  mega_file: { url: (id) => `/mega-files/${id}`, key: "mega_file" },
};

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
  const queryClient = useQueryClient();
  const modals = useEntityModals();

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
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const search = useSecondBrainSearch(query);
  const results = useMemo(() => search.data ?? [], [search.data]);

  const grouped = useMemo(() => {
    const buckets: Record<string, SearchResult[]> = {};
    for (const r of results) {
      (buckets[r.type] ??= []).push(r);
    }
    const ordered: { section: SectionConfig; items: SearchResult[] }[] = [];
    for (const section of SECTIONS) {
      const items = buckets[section.type];
      if (items && items.length > 0) ordered.push({ section, items });
    }
    return ordered;
  }, [results]);

  const flat = useMemo(
    () => grouped.flatMap((g) => g.items.map((item) => ({ section: g.section, item }))),
    [grouped],
  );

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

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  async function openInModal(r: SearchResult) {
    if (r.type === "tag") {
      router.push("/tags");
      close();
      return;
    }
    const cfg = FETCH_BY_TYPE[r.type];
    if (!cfg) {
      router.push(SECTION_BY_TYPE[r.type]?.fullPagePath(r.id) ?? "/second-brain");
      close();
      return;
    }
    try {
      const { data } = await api.get<Record<string, unknown>>(cfg.url(r.id));
      const entity = (cfg.key ? data[cfg.key] : data) as Parameters<typeof modals.openEdit>[1];
      modals.openEdit(r.type as Exclude<GraphNodeKind, "tag">, entity);
      // Seed react-query cache so the page render after closing the modal is
      // already warm.
      queryClient.setQueryData([r.type, r.id], entity);
      close();
    } catch (err) {
      console.error("Failed to load entity for spotlight modal", err);
      router.push(SECTION_BY_TYPE[r.type]?.fullPagePath(r.id) ?? "/second-brain");
      close();
    }
  }

  function openFullPage(r: SearchResult) {
    const path = SECTION_BY_TYPE[r.type]?.fullPagePath(r.id);
    if (!path) return;
    router.push(path);
    close();
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore — the clipboard API can fail in non-secure contexts.
    }
    close();
  }

  function openInNewTab(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    close();
  }

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

  const showEmpty = query.trim().length < 2;
  const showNoResults = !showEmpty && !search.isLoading && results.length === 0;

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-20">
        <div
          className="fixed inset-0 bg-zinc-900/50 transition-opacity"
          onClick={() => setOpen(false)}
        />

        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-900"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        >
          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlighted((h) => Math.min(flat.length - 1, h + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlighted((h) => Math.max(0, h - 1));
                  } else if (e.key === "Enter") {
                    const selected = flat[highlighted];
                    if (selected) void openInModal(selected.item);
                  }
                }}
                placeholder="Search tags, bookmarks, notes, recipes..."
                className="w-full border-0 bg-transparent py-4 pl-12 pr-12 text-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 260px)" }}
          >
            {showEmpty ? (
              <div className="px-8 py-12 text-center text-zinc-500 dark:text-zinc-400">
                <FaSearch className="mx-auto mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <div className="text-base">Start typing to search…</div>
                <div className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
                  Search for bookmarks, notes, recipes, places, people, and more
                </div>
              </div>
            ) : search.isLoading ? (
              <div className="px-8 py-12 text-center text-zinc-500 dark:text-zinc-400">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
                <div className="mt-3 text-base">Searching…</div>
              </div>
            ) : showNoResults ? (
              <div className="px-8 py-12 text-center text-zinc-500 dark:text-zinc-400">
                <FaSearch className="mx-auto mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <div className="text-base">No results found for &ldquo;{query}&rdquo;</div>
              </div>
            ) : (
              <div>
                {grouped.map(({ section, items }) => (
                  <div key={section.type}>
                    <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-950">
                      <div className="flex items-center gap-2">
                        <section.Icon
                          className={`h-4 w-4 ${section.color.replace("bg-", "text-")}`}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                          {section.label}
                        </span>
                      </div>
                    </div>
                    <div>
                      {items.map((item) => {
                        const globalIndex = flat.findIndex(
                          (f) => f.section.type === section.type && f.item.id === item.id,
                        );
                        const isSelected = globalIndex === highlighted;
                        const isBookmark = item.type === "bookmark";
                        const hasFullPage = item.type !== "tag";
                        return (
                          <div
                            key={`${section.type}-${item.id}`}
                            ref={isSelected ? selectedItemRef : null}
                            role="button"
                            tabIndex={-1}
                            onClick={() => void openInModal(item)}
                            onMouseEnter={() => setHighlighted(globalIndex)}
                            className={[
                              "w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-zinc-100 focus:outline-none dark:hover:bg-zinc-800",
                              isSelected
                                ? "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                : "",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${section.color}`}
                              >
                                <section.Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                  {item.title}
                                </div>
                                {item.subtitle ? (
                                  <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                                    {item.subtitle}
                                  </div>
                                ) : null}
                              </div>
                              {(isBookmark || hasFullPage) && (
                                <div
                                  className="flex flex-shrink-0 items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {hasFullPage && (
                                    <button
                                      type="button"
                                      aria-label="Open full page"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openFullPage(item);
                                      }}
                                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:text-zinc-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                    >
                                      <FaExpand className="h-4 w-4" />
                                    </button>
                                  )}
                                  {isBookmark && item.subtitle && (
                                    <>
                                      <button
                                        type="button"
                                        aria-label="Copy link"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void copyUrl(item.subtitle as string);
                                        }}
                                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:text-zinc-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                      >
                                        <FaCopy className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        aria-label="Open in new tab"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openInNewTab(item.subtitle as string);
                                        }}
                                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:text-zinc-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                      >
                                        <FaExternalLinkAlt className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-700 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  ↑
                </kbd>
                <kbd className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-700 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  ↓
                </kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-700 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  ENTER
                </kbd>
                <span>to select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-700 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  ESC
                </kbd>
                <span>to close</span>
              </div>
              <span className="ml-auto">
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
