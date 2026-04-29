"use client";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { useTrips } from "@/lib/queries/entities";

export default function TripsPage() {
  const { data, isLoading, error } = useTrips();
  const trips = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    trips,
    (t) => `${t.name} ${t.notes ?? ""} ${t.locations ?? ""}`,
  );

  return (
    <EntityListShell
      title="Trips"
      isLoading={isLoading}
      error={error}
      empty={trips.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter trips…"
              count={filtered.length}
              total={trips.length}
            />

          </div>
          <NewEntityButton href="/trips/new" label="New trip" />

        </div>
        <CardGrid>
          {filtered.map((trip) => (
            <Card key={trip.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{trip.name}</span>
                <EditLink href={`/trips/${trip.id}`} />
              </div>
              {trip.notes ? (
                <p
                  className="line-clamp-2 text-sm text-zinc-500"
                  dangerouslySetInnerHTML={{ __html: trip.notes }}
                />
              ) : null}
              {trip.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {trip.tags.map((tag) => (
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
