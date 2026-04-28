"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

import { EntityListShell, TagChip } from "@/components/EntityListShell";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { useBookmarks } from "@/lib/queries/entities";

export default function BookmarksPage() {
  const { data, isLoading, error } = useBookmarks();
  const bookmarks = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    bookmarks,
    (b) => `${b.title} ${b.url} ${b.description ?? ""}`,
  );

  return (
    <EntityListShell
      title="Bookmarks"
      isLoading={isLoading}
      error={error}
      empty={bookmarks.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter bookmarks…"
              count={filtered.length}
              total={bookmarks.length}
            />
          </div>
          <Link href="/bookmarks/new">
            <Button variant="primary" size="sm">
              + New bookmark
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  {bookmark.title}
                </a>
                <Link
                  href={`/bookmarks/${bookmark.id}`}
                  className="shrink-0 text-xs text-zinc-500 hover:underline"
                >
                  Edit
                </Link>
              </div>
              <span className="truncate text-xs text-zinc-500">
                {bookmark.url}
              </span>
              {bookmark.description ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {bookmark.description}
                </p>
              ) : null}
              {bookmark.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {bookmark.tags.map((tag) => (
                    <TagChip key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </EntityListShell>
  );
}
