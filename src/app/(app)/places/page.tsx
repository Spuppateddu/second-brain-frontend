"use client";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { usePlaces } from "@/lib/queries/entities";

export default function PlacesPage() {
  const { data, isLoading, error } = usePlaces();
  const places = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    places,
    (p) => `${p.name} ${p.description ?? ""} ${p.url ?? ""}`,
  );

  return (
    <EntityListShell
      title="Places"
      isLoading={isLoading}
      error={error}
      empty={places.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter places…"
              count={filtered.length}
              total={places.length}
            />

          </div>
          <NewEntityButton href="/places/new" label="New place" />

        </div>
        <CardGrid>
          {filtered.map((place) => (
            <Card key={place.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{place.name}</span>
                <EditLink href={`/places/${place.id}`} />
              </div>
              {place.description ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {place.description}
                </p>
              ) : null}
              {place.url ? (
                <a
                  href={place.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-primary hover:underline"
                >
                  {place.url}
                </a>
              ) : null}
              {place.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {place.tags.map((tag) => (
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
