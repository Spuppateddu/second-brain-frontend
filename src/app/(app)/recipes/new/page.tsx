"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import { RecipeForm } from "@/components/RecipeForm";
import { FormSection } from "@/components/UI/FormSection";
import { useCreateRecipe } from "@/lib/queries/entities";

export default function NewRecipePage() {
  const router = useRouter();
  const create = useCreateRecipe();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell title="New recipe">
      <FormSection title="Details">
        <RecipeForm
          submitLabel="Create"
          isPending={create.isPending}
          error={error}
          onCancel={() => router.push("/recipes")}
          onSubmit={async (input) => {
            setError(null);
            try {
              const recipe = await create.mutateAsync(input);
              router.push(`/recipes/${recipe.id}`);
            } catch (err) {
              const message =
                (err as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Failed to save.";
              setError(message);
            }
          }}
        />
      </FormSection>
    </EntityListShell>
  );
}
