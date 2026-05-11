"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { HiTrash } from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { RecipeForm } from "@/components/RecipeForm";
import AnchorToggleButton from "@/components/SecondBrain/AnchorToggleButton";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
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
      <FormSection
        title="Details"
        actions={
          <IconButton
            size="sm"
            variant="danger"
            label="Delete recipe"
            disabled={remove.isPending}
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
            <HiTrash />
          </IconButton>
        }
      >
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
                (err as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Failed to save.";
              setError(message);
            }
          }}
        />
      </FormSection>
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
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Invalid recipe id.
        </p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Recipe · ${data.title}` : "Recipe"}
      isLoading={isLoading}
      error={error}
      headerActions={
        data ? <AnchorToggleButton type="recipe" id={data.id} /> : undefined
      }
    >
      {data ? <RecipeEditCard recipe={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
