"use client";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { useBags } from "@/lib/queries/entities";

export default function BagsPage() {
  const { data, isLoading, error } = useBags();
  const bags = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    bags,
    (b) => `${b.title} ${b.description ?? ""}`,
  );

  return (
    <EntityListShell
      title="Bags"
      isLoading={isLoading}
      error={error}
      empty={bags.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter bags…"
              count={filtered.length}
              total={bags.length}
            />
          </div>
          <NewEntityButton href="/bags/new" label="New bag" />
        </div>
        <CardGrid>
          {filtered.map((bag) => (
            <Card key={bag.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{bag.title}</span>
                <EditLink href={`/bags/${bag.id}`} />
              </div>
              {bag.description ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {bag.description}
                </p>
              ) : null}
              {bag.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {bag.tags.map((tag) => (
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
