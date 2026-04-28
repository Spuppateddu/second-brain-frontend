"use client";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { usePersons } from "@/lib/queries/entities";

export default function PersonsPage() {
  const { data, isLoading, error } = usePersons();
  const persons = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    persons,
    (p) => `${p.name} ${p.description ?? ""}`,
  );

  return (
    <EntityListShell
      title="People"
      isLoading={isLoading}
      error={error}
      empty={persons.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter people…"
              count={filtered.length}
              total={persons.length}
            />

          </div>
          <NewEntityButton href="/persons/new" label="New person" />

        </div>
        <CardGrid>
          {filtered.map((person) => (
            <Card key={person.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{person.name}</span>
                <EditLink href={`/persons/${person.id}`} />
              </div>
              {person.birth_date ? (
                <span className="text-xs text-zinc-500">
                  Born {person.birth_date}
                </span>
              ) : null}
              {person.description ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {person.description}
                </p>
              ) : null}
              {person.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {person.tags.map((tag) => (
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
