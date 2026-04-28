"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Card,
  CardGrid,
  EntityListShell,
} from "@/components/EntityListShell";
import {
  useConnectTags,
  useDisconnectTags,
  useTags,
} from "@/lib/queries/entities";
import { useSecondBrain } from "@/lib/queries/heavy";
import type { Tag } from "@/types/entities";
import type { TagConnection } from "@/types/graph";

const COUNT_KEYS = [
  "bookmarks_count",
  "notes_count",
  "recipes_count",
  "wishlist_items_count",
  "places_count",
  "persons_count",
  "bags_count",
  "hardware_count",
  "software_count",
  "mega_files_count",
  "trips_count",
] as const;

function ConnectionList({
  tag,
  connectedTags,
  otherTags,
}: {
  tag: Tag;
  connectedTags: Tag[];
  otherTags: Tag[];
}) {
  const connect = useConnectTags();
  const disconnect = useDisconnectTags();
  const [picking, setPicking] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        Connected ({connectedTags.length})
      </span>
      <div className="flex flex-wrap gap-1">
        {connectedTags.map((other) => (
          <button
            key={other.id}
            type="button"
            disabled={disconnect.isPending}
            onClick={() => {
              if (!confirm(`Disconnect "${tag.name}" from "${other.name}"?`))
                return;
              disconnect.mutate({ tag_id_1: tag.id, tag_id_2: other.id });
            }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            style={{
              backgroundColor: `${other.color}20`,
              color: other.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: other.color }}
            />
            {other.name}
            <span className="ml-1 text-zinc-500">×</span>
          </button>
        ))}
        {connectedTags.length === 0 ? (
          <span className="text-xs text-zinc-500">No connections.</span>
        ) : null}
      </div>
      {picking ? (
        <div className="flex flex-col gap-1">
          <select
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue=""
            disabled={connect.isPending || otherTags.length === 0}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (Number.isNaN(id) || id <= 0) return;
              connect.mutate(
                { tag_id_1: tag.id, tag_id_2: id },
                { onSuccess: () => setPicking(false) },
              );
            }}
          >
            <option value="" disabled>
              {otherTags.length === 0
                ? "Nothing to connect"
                : "Pick a tag…"}
            </option>
            {otherTags.map((other) => (
              <option key={other.id} value={other.id}>
                {other.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="self-start text-xs text-zinc-500 hover:underline"
            onClick={() => setPicking(false)}
          >
            cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="self-start text-xs text-primary hover:underline"
          disabled={otherTags.length === 0}
        >
          + Connect to another tag
        </button>
      )}
    </div>
  );
}

export default function TagsPage() {
  const tags = useTags();
  const sb = useSecondBrain();

  const tagsList = useMemo(() => tags.data ?? [], [tags.data]);
  const tagsById = useMemo(() => {
    const map = new Map<number, Tag>();
    for (const tag of tagsList) map.set(tag.id, tag);
    return map;
  }, [tagsList]);

  const connectionsByTag = useMemo(() => {
    const map = new Map<number, Set<number>>();
    const cs = (sb.data?.tagConnections ?? []) as TagConnection[];
    for (const c of cs) {
      if (!map.has(c.tag_id_1)) map.set(c.tag_id_1, new Set());
      if (!map.has(c.tag_id_2)) map.set(c.tag_id_2, new Set());
      map.get(c.tag_id_1)!.add(c.tag_id_2);
      map.get(c.tag_id_2)!.add(c.tag_id_1);
    }
    return map;
  }, [sb.data]);

  return (
    <EntityListShell
      title="Tags"
      description="The connective tissue of the second brain. Click connections to remove or use the picker to link two tags."
      isLoading={tags.isLoading}
      error={tags.error}
      empty={tagsList.length === 0}
    >
      <CardGrid>
        {tagsList.map((tag) => {
          const connectedIds = connectionsByTag.get(tag.id) ?? new Set();
          const connected = tagsList.filter((t) => connectedIds.has(t.id));
          const other = tagsList.filter(
            (t) => t.id !== tag.id && !connectedIds.has(t.id),
          );
          return (
            <Card key={tag.id}>
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/tags/${tag.id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium">{tag.name}</span>
                </Link>
              </div>
              <div className="flex flex-wrap gap-1 text-xs text-zinc-500">
                {COUNT_KEYS.map((k) => {
                  const n = (tag[k] ?? 0) as number;
                  if (n === 0) return null;
                  const label = k.replace("_count", "").replace(/_/g, " ");
                  return (
                    <span
                      key={k}
                      className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800"
                    >
                      {label} · {n}
                    </span>
                  );
                })}
              </div>
              <ConnectionList
                tag={tag}
                connectedTags={connected}
                otherTags={other}
              />
            </Card>
          );
        })}
      </CardGrid>
      <span className="sr-only">{tagsById.size}</span>
    </EntityListShell>
  );
}
