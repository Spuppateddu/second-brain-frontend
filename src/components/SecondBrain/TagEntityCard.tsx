"use client";

import { useQuery } from "@tanstack/react-query";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiDocumentDuplicate,
  HiLink,
  HiPencilSquare,
  HiPlus,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import {
  ENTITY_ICONS,
  ENTITY_LABELS,
  getEntityBorderColor,
} from "@/constants/entityIcons";
import { isUntaggedTag } from "@/constants/untagged";
import { api } from "@/lib/api";
import type { Tag } from "@/types/entities";
import type { GraphNodeKind } from "@/types/graph";

import { useEntityModals } from "./EntityModalsProvider";

interface TagEntityCardProps {
  tag: Tag;
  screenPosition: { x: number; y: number } | null;
  highlightEntity?: { type: string; id: number } | null;
  onClose: () => void;
  onEditTag?: (tag: Tag) => void;
  onDeleteTag?: (tag: Tag) => void;
}

type ApiItem = {
  id: number;
  [key: string]: unknown;
};

type TagShowPayload = Record<string, unknown> & {
  connected_tags?: { id: number }[];
};

type GroupItem = {
  id: number;
  title: string;
  subtitle?: string;
  url?: string;
  raw: ApiItem;
};

type ElementGroup = {
  type: string;
  apiKey: string;
  items: GroupItem[];
};

const GROUPS: Array<{
  type: string;
  apiKey: string;
  titleField: string;
  subtitleField?: string;
  urlField?: string;
}> = [
  { type: "bookmark", apiKey: "bookmarks", titleField: "title", urlField: "url" },
  { type: "note", apiKey: "notes", titleField: "title" },
  { type: "recipe", apiKey: "recipes", titleField: "title" },
  { type: "wishlist_item", apiKey: "wishlist_items", titleField: "name" },
  { type: "place", apiKey: "places", titleField: "name", subtitleField: "city" },
  { type: "person", apiKey: "persons", titleField: "name", subtitleField: "email" },
  { type: "bag", apiKey: "bags", titleField: "title" },
  { type: "hardware", apiKey: "hardware", titleField: "title" },
  { type: "software", apiKey: "software", titleField: "title" },
  { type: "mega_file", apiKey: "mega_files", titleField: "title" },
  { type: "trip", apiKey: "trips", titleField: "name" },
];

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function TagEntityCard({
  tag,
  screenPosition,
  highlightEntity,
  onClose,
  onEditTag,
  onDeleteTag,
}: TagEntityCardProps) {
  const modals = useEntityModals();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createMenuPosition, setCreateMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const createMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const highlightRowRef = useRef<HTMLLIElement | null>(null);
  const isUntagged = isUntaggedTag(tag.id);

  useEffect(() => {
    if (!createMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inButton = createMenuButtonRef.current?.contains(target);
      const inMenu = createMenuRef.current?.contains(target);
      if (!inButton && !inMenu) setCreateMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createMenuOpen]);

  useEffect(() => {
    if (!createMenuOpen) return;
    const updatePosition = () => {
      const btn = createMenuButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const menuWidth = 176;
      const menuMaxHeight = Math.min(window.innerHeight * 0.6, 420);
      const gap = 4;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8)
        left = window.innerWidth - menuWidth - 8;
      let top = rect.bottom + gap;
      if (top + menuMaxHeight > window.innerHeight - 8) {
        const above = rect.top - gap - menuMaxHeight;
        if (above >= 8) top = rect.top - gap - menuMaxHeight;
      }
      setCreateMenuPosition({ top, left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [createMenuOpen]);

  const { data, isLoading: loading } = useQuery<TagShowPayload>({
    queryKey: ["tag-card", tag.id] as const,
    queryFn: async () => {
      const url = isUntaggedTag(tag.id)
        ? "/second-brain/untagged"
        : `/tags/${tag.id}`;
      const { data: payload } = await api.get<TagShowPayload>(url);
      return payload;
    },
  });

  useEffect(() => {
    if (highlightEntity && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightEntity, data]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const groups: ElementGroup[] = useMemo(() => {
    if (!data) return [];
    return GROUPS.map((g) => {
      const raw = ((data[g.apiKey] as ApiItem[] | undefined) ?? []) as ApiItem[];
      return {
        type: g.type,
        apiKey: g.apiKey,
        items: raw.map((r) => ({
          id: r.id,
          title: (r[g.titleField] as string) ?? `#${r.id}`,
          subtitle: g.subtitleField
            ? ((r[g.subtitleField] as string) ?? undefined)
            : undefined,
          url: g.urlField ? ((r[g.urlField] as string) ?? undefined) : undefined,
          raw: r,
        })),
      };
    }).filter((g) => g.items.length > 0);
  }, [data]);

  const totalCount = groups.reduce((s, g) => s + g.items.length, 0);

  const handleOpen = (type: string, raw: ApiItem) => {
    modals.openEdit(
      type as Exclude<GraphNodeKind, "tag">,
      raw as Parameters<typeof modals.openEdit>[1],
    );
  };

  const handleCreate = (type: string) => {
    setCreateMenuOpen(false);
    // Pre-select the current tag so the freshly created entity is automatically
    // tagged with whatever tag-card the user opened it from.
    modals.openCreate(
      type as Exclude<GraphNodeKind, "tag">,
      isUntaggedTag(tag.id) ? undefined : tag.id,
    );
  };

  const handleCopy = async (
    type: string,
    id: number,
    title: string,
    url?: string,
  ) => {
    const text = url ? `${title}\n${url}` : title;
    const ok = await copyToClipboard(text);
    if (ok) {
      const key = `${type}-${id}`;
      setCopiedId(key);
      setTimeout(
        () => setCopiedId((cur) => (cur === key ? null : cur)),
        1200,
      );
    }
  };

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  const style: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: "70vh",
      }
    : screenPosition
      ? {
          position: "fixed",
          left: Math.min(screenPosition.x + 80, window.innerWidth - 380),
          top: Math.max(
            16,
            Math.min(screenPosition.y - 40, window.innerHeight - 520),
          ),
          width: 360,
          maxHeight: "70vh",
        }
      : {
          position: "fixed",
          right: 16,
          top: 80,
          width: 360,
          maxHeight: "70vh",
        };

  return (
    <div
      style={style}
      className="z-40 flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div
        className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700"
        style={{ backgroundColor: tag.color ? `${tag.color}15` : undefined }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: tag.color || "#3B82F6" }}
          />
          <div className="min-w-0">
            <div className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
              {tag.name}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {totalCount} elements ·{" "}
              {(data?.connected_tags ?? []).length} connections
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isUntagged && (
            <>
              <button
                ref={createMenuButtonRef}
                onClick={() => setCreateMenuOpen((o) => !o)}
                className="p-1 text-zinc-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-300"
                aria-label="Create new entity"
                title="New element"
              >
                <HiPlus className="h-5 w-5" />
              </button>
              {createMenuOpen &&
                createMenuPosition &&
                typeof document !== "undefined" &&
                createPortal(
                  <div
                    ref={createMenuRef}
                    className="fixed z-[100] w-44 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                    style={{
                      top: createMenuPosition.top,
                      left: createMenuPosition.left,
                      maxHeight: "min(60vh, 420px)",
                    }}
                  >
                    {GROUPS.map((g) => {
                      const iconCmp =
                        ENTITY_ICONS[g.type as keyof typeof ENTITY_ICONS];
                      return (
                        <button
                          key={g.type}
                          onClick={() => handleCreate(g.type)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                        >
                          {createElement(iconCmp, {
                            className: "h-4 w-4",
                            style: {
                              color: getEntityBorderColor(g.type),
                            },
                          })}
                          {ENTITY_LABELS[g.type as keyof typeof ENTITY_LABELS]}
                        </button>
                      );
                    })}
                  </div>,
                  document.body,
                )}
              {onEditTag && (
                <button
                  onClick={() => onEditTag(tag)}
                  className="p-1 text-zinc-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-300"
                  aria-label="Edit tag"
                  title="Edit tag"
                >
                  <HiPencilSquare className="h-5 w-5" />
                </button>
              )}
              {onDeleteTag && (
                <button
                  onClick={() => onDeleteTag(tag)}
                  className="p-1 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                  aria-label="Delete tag"
                  title="Delete tag"
                >
                  <HiTrash className="h-5 w-5" />
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="p-4 text-center text-sm text-zinc-500">Loading…</div>
        )}
        {!loading && groups.length === 0 && (
          <div className="p-4 text-center text-sm text-zinc-500">
            No elements tagged yet.
          </div>
        )}
        {groups.map((g) => {
          const iconCmp = ENTITY_ICONS[g.type as keyof typeof ENTITY_ICONS];
          const color = getEntityBorderColor(g.type);
          return (
            <div key={g.type} className="mb-3">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {createElement(iconCmp, {
                  className: "h-4 w-4",
                  style: { color },
                })}
                {ENTITY_LABELS[g.type as keyof typeof ENTITY_LABELS]}
                <span className="text-zinc-400">({g.items.length})</span>
              </div>
              <ul>
                {g.items.map((it) => {
                  const copyKey = `${g.type}-${it.id}`;
                  const isHighlighted =
                    highlightEntity?.type === g.type &&
                    highlightEntity?.id === it.id;
                  return (
                    <li
                      key={it.id}
                      ref={isHighlighted ? highlightRowRef : undefined}
                      className={[
                        "group flex items-center gap-2 rounded px-2 py-1.5 transition-colors",
                        isHighlighted
                          ? "animate-pulse bg-yellow-100 ring-2 ring-yellow-400 dark:bg-yellow-900/40"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-700",
                      ].join(" ")}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                          {it.title}
                        </div>
                        {it.subtitle && (
                          <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {it.subtitle}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {it.url && (
                          <a
                            href={it.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-zinc-500 hover:text-sky-600 dark:text-zinc-400"
                            title="Open URL"
                          >
                            <HiLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpen(g.type, it.raw)}
                          className="p-1 text-zinc-500 hover:text-sky-600 dark:text-zinc-400"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleCopy(g.type, it.id, it.title, it.url)
                          }
                          className={[
                            "p-1",
                            copiedId === copyKey
                              ? "text-green-600"
                              : "text-zinc-500 hover:text-sky-600 dark:text-zinc-400",
                          ].join(" ")}
                          title={copiedId === copyKey ? "Copied!" : "Copy"}
                        >
                          <HiDocumentDuplicate className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
