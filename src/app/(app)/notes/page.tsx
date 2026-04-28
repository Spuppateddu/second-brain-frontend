"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

import { EntityListShell, TagChip } from "@/components/EntityListShell";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { useNotes } from "@/lib/queries/entities";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export default function NotesPage() {
  const { data, isLoading, error } = useNotes();
  const notes = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    notes,
    (n) => `${n.title} ${stripHtml(n.content ?? "")}`,
  );

  return (
    <EntityListShell
      title="Notes"
      isLoading={isLoading}
      error={error}
      empty={notes.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter notes…"
              count={filtered.length}
              total={notes.length}
            />
          </div>
          <Link href="/notes/new">
            <Button variant="primary" size="sm">
              + New note
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <div className="font-medium">{note.title}</div>
              {note.content ? (
                <p className="line-clamp-3 text-sm text-zinc-500">
                  {stripHtml(note.content)}
                </p>
              ) : null}
              {note.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <TagChip key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </EntityListShell>
  );
}
