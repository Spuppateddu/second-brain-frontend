"use client";

import { useState } from "react";

import EntityModalShell from "@/components/SecondBrain/EntityModalShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import SearchableToggle from "@/components/SecondBrain/SearchableToggle";
import {
  FooterCloseButton,
  FooterPrimaryButton,
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import { useCreateRecipe, useUpdateRecipe } from "@/lib/queries/entities";
import type { Recipe } from "@/types/entities";

interface RecipeFormModalProps {
  isOpen: boolean;
  initial?: Recipe | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function RecipeFormModal(props: RecipeFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <RecipeFormModalInner key={key} {...props} />;
}

function RecipeFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: RecipeFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | ""
  >(initial?.difficulty ?? "");
  const [timeMinutes, setTimeMinutes] = useState(
    initial?.time_minutes != null ? String(initial.time_minutes) : "",
  );
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateRecipe();
  const updateMut = useUpdateRecipe(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;
  void isSearchable;

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Recipe title is required.");
      return;
    }
    const payload = {
      title: title.trim(),
      ingredients: ingredients.trim() || null,
      instructions: instructions.trim() || null,
      difficulty: difficulty === "" ? null : difficulty,
      time_minutes: timeMinutes.trim()
        ? Number.parseInt(timeMinutes, 10)
        : null,
      tag_ids: tagIds,
    };
    try {
      if (initial) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to save.",
      );
    }
  };

  return (
    <EntityModalShell
      isOpen
      onClose={onClose}
      size="xl"
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={setTitle}
          placeholder={initial ? "Recipe title" : "New Recipe"}
        />
      }
      footer={
        <>
          <FooterCloseButton onClick={onClose} isPending={isPending} />
          <FooterPrimaryButton onClick={submit} isPending={isPending}>
            {initial ? "Save" : "Create Recipe"}
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormFieldLabel>Difficulty</FormFieldLabel>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "easy" | "medium" | "hard" | "")
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">—</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <FormFieldLabel>Time (minutes)</FormFieldLabel>
            <input
              type="number"
              min={0}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <FormFieldLabel>Ingredients</FormFieldLabel>
          <textarea
            rows={4}
            value={ingredients ?? ""}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="One per line"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <FormFieldLabel>Instructions</FormFieldLabel>
          <textarea
            rows={6}
            value={instructions ?? ""}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <InlineTagPicker
          selectedTagIds={tagIds}
          onChange={setTagIds}
          prefillTagId={prefillTagId}
        />

        <SearchableToggle value={isSearchable} onChange={setIsSearchable} />

        <FormError message={error} />
      </div>
    </EntityModalShell>
  );
}
