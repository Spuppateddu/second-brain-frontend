"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import RecipeEditor from "@/components/SecondBrain/forms/RecipeEditor";
import { useRecipe } from "@/lib/queries/entities";

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const recipeId = Number(id);

  const { data, isLoading, error } = useRecipe(
    Number.isNaN(recipeId) ? null : recipeId,
  );

  if (Number.isNaN(recipeId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid recipe id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading recipe…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this recipe.
      </main>
    );
  }

  return (
    <RecipeEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="recipe" id={data.id} />}
    />
  );
}
