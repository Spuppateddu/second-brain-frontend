"use client";

import { useQuery } from "@tanstack/react-query";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

import { ENTITY_ICONS, getEntityBorderColor } from "@/constants/entityIcons";
import { api } from "@/lib/api";
import type { Tag } from "@/types/entities";

export interface EntitySearchResult {
  id: number;
  type: string;
  type_label: string;
  title: string;
  subtitle?: string | null;
}

interface GraphSearchOverlayProps {
  tags: Tag[];
  onPickTag: (tag: Tag) => void;
  onPickEntity: (entity: EntitySearchResult) => void;
}

export default function GraphSearchOverlay({
  tags,
  onPickTag,
  onPickEntity,
}: GraphSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tagResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tags
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, tags]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data: searchData, isFetching: loadingEntities } = useQuery<{
    results?: EntitySearchResult[];
  }>({
    queryKey: ["secondbrain", "search", debouncedQuery] as const,
    enabled: debouncedQuery.length > 0,
    queryFn: async () => {
      const { data } = await api.get<{ results?: EntitySearchResult[] }>(
        "/secondbrain/search",
        { params: { query: debouncedQuery } },
      );
      return data;
    },
  });
  const entityResults = useMemo(
    () => (searchData?.results ?? []).slice(0, 10),
    [searchData],
  );

  const hasResults = tagResults.length > 0 || entityResults.length > 0;

  return (
    <div className="absolute top-4 left-4 z-20 w-80 max-w-[calc(100vw-8rem)]">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center px-3 py-2">
          <HiMagnifyingGlass className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search tags or elements…"
            className="flex-1 border-0 bg-transparent px-2 text-sm text-zinc-900 outline-none dark:text-zinc-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-zinc-400 hover:text-zinc-600"
              aria-label="Clear"
            >
              <HiXMark className="h-4 w-4" />
            </button>
          )}
        </div>

        {open && query && (
          <div className="max-h-96 overflow-y-auto border-t border-zinc-200 dark:border-zinc-700">
            {tagResults.length > 0 && (
              <>
                <div className="bg-zinc-50 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-900/40 dark:text-zinc-400">
                  Tags
                </div>
                <ul>
                  {tagResults.map((tag) => (
                    <li key={`tag-${tag.id}`}>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onPickTag(tag);
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        <span
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: tag.color || "#3B82F6" }}
                        />
                        <span className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                          {tag.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {entityResults.length > 0 && (
              <>
                <div className="bg-zinc-50 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-900/40 dark:text-zinc-400">
                  Elements
                </div>
                <ul>
                  {entityResults.map((entity) => {
                    const iconCmp =
                      ENTITY_ICONS[entity.type as keyof typeof ENTITY_ICONS];
                    return (
                      <li key={`${entity.type}-${entity.id}`}>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onPickEntity(entity);
                            setQuery("");
                          }}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          {iconCmp &&
                            createElement(iconCmp, {
                              className: "mt-0.5 h-4 w-4 flex-shrink-0",
                              style: {
                                color: getEntityBorderColor(entity.type),
                              },
                            })}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                              {entity.title}
                            </div>
                            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {entity.type_label}
                              {entity.subtitle ? ` · ${entity.subtitle}` : ""}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {!loadingEntities && !hasResults && (
              <div className="px-3 py-3 text-sm text-zinc-500">No matches.</div>
            )}
            {loadingEntities &&
              entityResults.length === 0 &&
              tagResults.length === 0 && (
                <div className="px-3 py-3 text-sm text-zinc-500">
                  Searching…
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
