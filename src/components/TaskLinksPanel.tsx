"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

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
  trip: "#14b8a6",
};

const TYPE_TO_MODEL: Record<string, string> = {
  note: "App\\Models\\Note",
  bookmark: "App\\Models\\Bookmark",
  recipe: "App\\Models\\Recipe",
  wishlist_item: "App\\Models\\WishlistItem",
  place: "App\\Models\\Place",
  person: "App\\Models\\Person",
  bag: "App\\Models\\Bag",
  hardware: "App\\Models\\Hardware",
  software: "App\\Models\\Software",
  trip: "App\\Models\\Trip",
};

const SUPPORTED_TYPES = new Set(Object.keys(TYPE_TO_MODEL));

export type LinkedRef = { id: number; type: string; label: string };

type LinkableSummary = { id: number; title?: string; name?: string };

/**
 * Walk a task-like entity's `linked*` relations and flatten them into a single
 * list. Mirrors the keys eager-loaded by the various task controllers.
 */
export function collectTaskLinks(
  task: Record<string, unknown>,
): LinkedRef[] {
  const out: LinkedRef[] = [];
  const push = (key: string, type: string) => {
    const items = task[key] as LinkableSummary[] | undefined;
    if (!items) return;
    for (const it of items) {
      out.push({
        id: it.id,
        type,
        label: it.title ?? it.name ?? `#${it.id}`,
      });
    }
  };
  push("linkedNotes", "note");
  push("linkedBookmarks", "bookmark");
  push("linkedRecipes", "recipe");
  push("linkedWishlistItems", "wishlist_item");
  push("linkedPlaces", "place");
  push("linkedPersons", "person");
  push("linkedBags", "bag");
  push("linkedHardware", "hardware");
  push("linkedSoftware", "software");
  push("linkedTrips", "trip");
  return out;
}

export function asLinkedEntitiesPayload(refs: LinkedRef[]) {
  return refs
    .filter((r) => SUPPORTED_TYPES.has(r.type))
    .map((r) => ({
      id: r.id,
      type: r.type,
      model_class: TYPE_TO_MODEL[r.type],
    }));
}

function typeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

export function TaskLinksPanel({
  links,
  isPending,
  onSave,
}: {
  links: LinkedRef[];
  isPending: boolean;
  onSave: (next: LinkedRef[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useSecondBrainSearch(query);

  const existingKeys = new Set(links.map((l) => `${l.type}-${l.id}`));

  async function add(result: SearchResult) {
    if (!SUPPORTED_TYPES.has(result.type)) return;
    if (existingKeys.has(`${result.type}-${result.id}`)) return;
    await onSave([
      ...links,
      { id: result.id, type: result.type, label: result.title },
    ]);
    setQuery("");
  }

  async function remove(ref: LinkedRef) {
    if (
      !confirm(
        `Disconnect "${ref.label}" (${typeLabel(ref.type)}) from this task?`,
      )
    )
      return;
    await onSave(
      links.filter((r) => !(r.type === ref.type && r.id === ref.id)),
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Linked entities</h3>
        <span className="text-xs text-zinc-500">{links.length} linked</span>
      </div>
      {links.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {links.map((ref) => {
            const color = TYPE_COLORS[ref.type] ?? "#94a3b8";
            return (
              <button
                key={`${ref.type}-${ref.id}`}
                type="button"
                disabled={isPending}
                onClick={() => remove(ref)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: `${color}20`, color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {typeLabel(ref.type)}
                  </span>{" "}
                  {ref.label}
                </span>
                <span className="ml-1 text-zinc-500">×</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {open ? (
        <div className="flex flex-col gap-2">
          <Input
            type="search"
            placeholder="Search anything (≥ 2 chars)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query.trim().length < 2 ? (
            <p className="text-xs text-zinc-500">Type to search.</p>
          ) : search.isLoading ? (
            <p className="text-xs text-zinc-500">Searching…</p>
          ) : search.data && search.data.length > 0 ? (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
              {search.data.map((r) => {
                const linked = existingKeys.has(`${r.type}-${r.id}`);
                const supported = SUPPORTED_TYPES.has(r.type);
                const disabled = isPending || linked || !supported;
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => add(r)}
                      className={[
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm",
                        disabled
                          ? "opacity-50"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      ].join(" ")}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: TYPE_COLORS[r.type] ?? "#94a3b8",
                        }}
                      />
                      <span className="flex-1 truncate">{r.title}</span>
                      <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                        {linked
                          ? "linked"
                          : !supported
                            ? "n/a"
                            : typeLabel(r.type)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">No matches.</p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          >
            Close
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          + Link an entity to this task
        </Button>
      )}
    </div>
  );
}
