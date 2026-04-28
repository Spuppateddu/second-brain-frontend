"use client";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { useMegaFiles } from "@/lib/queries/entities";

export default function MegaFilesPage() {
  const { data, isLoading, error } = useMegaFiles();
  const files = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    files,
    (f) => `${f.title} ${f.description ?? ""}`,
  );

  return (
    <EntityListShell
      title="Mega Files"
      description="Files (and folders) stored on MEGA, indexed in your second brain."
      isLoading={isLoading}
      error={error}
      empty={files.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter files…"
              count={filtered.length}
              total={files.length}
            />

          </div>
          <NewEntityButton href="/mega-files/new" label="New mega file" />

        </div>
        <CardGrid>
          {filtered.map((file) => (
            <Card key={file.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="truncate font-medium">{file.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {file.is_folder ? "folder" : (file.file_type ?? "file")}
                  </span>
                  <EditLink href={`/mega-files/${file.id}`} />
                </div>
              </div>
              {file.file_size ? (
                <span className="text-xs text-zinc-500">{file.file_size}</span>
              ) : null}
              {file.description ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {file.description}
                </p>
              ) : null}
              <a
                href={file.mega_link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-primary hover:underline"
              >
                Open on MEGA →
              </a>
              {file.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {file.tags.map((tag) => (
                    <TagChip key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </CardGrid>
      </div>
    </EntityListShell>
  );
}
