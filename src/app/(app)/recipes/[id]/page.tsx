"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { RecipeForm } from "@/components/RecipeForm";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import {
  useDeleteRecipe,
  useRecipe,
  useUpdateRecipe,
} from "@/lib/queries/entities";
import type { Recipe } from "@/types/entities";

function RecipeEditCard({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const update = useUpdateRecipe(recipe.id);
  const remove = useDeleteRecipe();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <RecipeForm
        initial={recipe}
        submitLabel="Save"
        isPending={update.isPending}
        error={error}
        onCancel={() => router.push("/recipes")}
        onSubmit={async (input) => {
          setError(null);
          try {
            await update.mutateAsync(input);
            router.push("/recipes");
          } catch (err) {
            const message =
              (err as { response?: { data?: { message?: string } } })?.response
                ?.data?.message ?? "Failed to save.";
            setError(message);
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          variant="danger-soft"
          size="sm"
          isDisabled={remove.isPending}
          onClick={async () => {
            if (!confirm("Delete this recipe?")) return;
            try {
              await remove.mutateAsync(recipe.id);
              router.push("/recipes");
            } catch {
              setError("Failed to delete.");
            }
          }}
        >
          Delete recipe
        </Button>
      </div>
      <SharableLinksPanel type="recipe" id={recipe.id} />
      <LinkedEntitiesPanel type="recipe" id={recipe.id} />
    </div>
  );
}

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  return (
    <EntityListShell
      title={data ? `Recipe · ${data.title}` : "Recipe"}
      isLoading={isLoading}
      error={error}
    >
      {data ? <RecipeEditCard recipe={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
