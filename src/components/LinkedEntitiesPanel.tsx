"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

import {
  useConnectEntities,
  useDisconnectEntities,
  useEntityLinks,
  useSecondBrainSearch,
  useTags,
  type LinkedNode,
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

function typeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

function LinkChip({
  link,
  onRemove,
  pending,
}: {
  link: LinkedNode;
  onRemove: () => void;
  pending: boolean;
}) {
  const color = link.color ?? TYPE_COLORS[link.type] ?? "#94a3b8";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
      style={{ backgroundColor: `${color}20`, color }}
      title={`Disconnect from ${link.label}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>
        <span className="text-[10px] uppercase tracking-wide opacity-70">
          {typeLabel(link.type)}
        </span>{" "}
        {link.label}
      </span>
      <span className="ml-1 text-zinc-500">×</span>
    </button>
  );
}

function PickerResults({
  results,
  alreadyLinked,
  ownType,
  ownId,
  onPick,
  pending,
}: {
  results: SearchResult[];
  alreadyLinked: Set<string>;
  ownType: string;
  ownId: number;
  onPick: (r: SearchResult) => void;
  pending: boolean;
}) {
  if (results.length === 0) return null;
  return (
    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
      {results.map((r) => {
        const key = `${r.type}-${r.id}`;
        const linked = alreadyLinked.has(key);
        const self = r.type === ownType && r.id === ownId;
        const disabled = pending || linked || self;
        return (
          <li key={key}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(r)}
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
                {self ? "self" : linked ? "linked" : typeLabel(r.type)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function LinkedEntitiesPanel({
  type,
  id,
}: {
  type: string;
  id: number;
}) {
  const links = useEntityLinks(type, id);
  const connect = useConnectEntities(type, id);
  const disconnect = useDisconnectEntities(type, id);
  const tags = useTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useSecondBrainSearch(query);

  const list = links.data ?? [];
  const alreadyLinked = new Set(list.map((l) => `${l.type}-${l.id}`));

  // Tag suggestions when no query: show user's tags as pickable.
  const tagSuggestions = (tags.data ?? [])
    .map<SearchResult>((t) => ({
      id: t.id,
      type: "tag",
      type_label: "Tag",
      title: t.name,
    }))
    .filter((s) => !alreadyLinked.has(`${s.type}-${s.id}`));

  const showSearch = query.trim().length >= 2;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Linked entities</h3>
        <span className="text-xs text-zinc-500">
          {links.isLoading ? "Loading…" : `${list.length} linked`}
        </span>
      </div>
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {list.map((link) => (
            <LinkChip
              key={`${link.type}-${link.id}`}
              link={link}
              pending={disconnect.isPending}
              onRemove={() => {
                if (
                  !confirm(
                    `Disconnect from "${link.label}" (${typeLabel(link.type)})?`,
                  )
                )
                  return;
                disconnect.mutate({ type: link.type, id: link.id });
              }}
            />
          ))}
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
          {showSearch ? (
            search.isLoading ? (
              <p className="text-xs text-zinc-500">Searching…</p>
            ) : search.data && search.data.length > 0 ? (
              <PickerResults
                results={search.data}
                alreadyLinked={alreadyLinked}
                ownType={type}
                ownId={id}
                pending={connect.isPending}
                onPick={(r) =>
                  connect.mutate(
                    { type: r.type, id: r.id },
                    {
                      onSuccess: () => {
                        setQuery("");
                      },
                    },
                  )
                }
              />
            ) : (
              <p className="text-xs text-zinc-500">No matches.</p>
            )
          ) : (
            <>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                Or pick a tag
              </span>
              <PickerResults
                results={tagSuggestions}
                alreadyLinked={alreadyLinked}
                ownType={type}
                ownId={id}
                pending={connect.isPending}
                onPick={(r) =>
                  connect.mutate({ type: r.type, id: r.id })
                }
              />
            </>
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
          + Link to another entity
        </Button>
      )}
    </div>
  );
}
