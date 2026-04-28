"use client";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { useRecipes } from "@/lib/queries/entities";

export default function RecipesPage() {
  const { data, isLoading, error } = useRecipes();
  const recipes = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    recipes,
    (r) => `${r.title} ${r.description ?? ""}`,
  );

  return (
    <EntityListShell
      title="Recipes"
      isLoading={isLoading}
      error={error}
      empty={recipes.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter recipes…"
              count={filtered.length}
              total={recipes.length}
            />

          </div>
          <NewEntityButton href="/recipes/new" label="New recipe" />

        </div>
        <CardGrid>
          {filtered.map((recipe) => (
            <Card key={recipe.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{recipe.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {recipe.steps.length} step
                    {recipe.steps.length === 1 ? "" : "s"}
                  </span>
                  <EditLink href={`/recipes/${recipe.id}`} />
                </div>
              </div>
              {recipe.description ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {recipe.description}
                </p>
              ) : null}
              {recipe.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {recipe.tags.map((tag) => (
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
