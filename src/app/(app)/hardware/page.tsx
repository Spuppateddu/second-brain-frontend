"use client";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { useHardware } from "@/lib/queries/entities";

export default function HardwarePage() {
  const { data, isLoading, error } = useHardware();
  const items = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    items,
    (i) => `${i.title} ${i.description ?? ""}`,
  );

  return (
    <EntityListShell
      title="Hardware"
      isLoading={isLoading}
      error={error}
      empty={items.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter hardware…"
              count={filtered.length}
              total={items.length}
            />

          </div>
          <NewEntityButton href="/hardware/new" label="New hardware" />

        </div>
        <CardGrid>
          {filtered.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{item.title}</span>
                <EditLink href={`/hardware/${item.id}`} />
              </div>
              {item.description ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {item.description}
                </p>
              ) : null}
              {item.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
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
