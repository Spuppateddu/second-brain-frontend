"use client";

import { useState } from "react";

import EntityActionBar from "@/components/SecondBrain/EntityActionBar";
import EntityEditorShell from "@/components/SecondBrain/EntityEditorShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import {
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import {
  useCreateRecipe,
  useDeleteRecipe,
  useUpdateRecipe,
} from "@/lib/queries/entities";
import type { Recipe } from "@/types/entities";

interface RecipeEditorProps {
  mode: "modal" | "page";
  initial?: Recipe | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function RecipeEditor(props: RecipeEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <RecipeEditorInner key={key} {...props} />;
}

function RecipeEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: RecipeEditorProps) {
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
  const [isSearchable, setIsSearchable] = useState(
    (initial as Recipe & { is_searchable?: boolean })?.is_searchable ?? true,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateRecipe();
  const updateMut = useUpdateRecipe(initial?.id ?? 0);
  const deleteMut = useDeleteRecipe();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const submit = async (closeAfter: boolean) => {
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
      is_searchable: isSearchable,
      tag_ids: tagIds,
    };
    try {
      if (initial) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
      onSaved?.();
      setDirty(false);
      if (closeAfter) onClose();
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

  const handleDelete = initial
    ? async () => {
        try {
          await deleteMut.mutateAsync(initial.id);
          onClose();
        } catch (e: unknown) {
          const err = e as { response?: { data?: { message?: string } } };
          setError(err?.response?.data?.message ?? "Failed to delete.");
        }
      }
    : undefined;

  return (
    <EntityEditorShell
      mode={mode}
      size="xl"
      onClose={onClose}
      belowBody={belowBody}
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={(v) => {
            setTitle(v);
            markDirty();
          }}
          placeholder={initial ? "Recipe title" : "New Recipe"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="recipe"
          id={initial?.id}
          entityLabel="recipe"
          dirty={dirty}
          isPending={isPending}
          isSearchable={{
            value: isSearchable,
            onChange: (v) => {
              setIsSearchable(v);
              markDirty();
            },
          }}
          onSave={() => submit(false)}
          onSaveAndExit={() => submit(true)}
          onDelete={handleDelete}
          onClose={mode === "modal" ? onClose : undefined}
        />
      }
    >
      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormFieldLabel>Difficulty</FormFieldLabel>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(
                  e.target.value as "easy" | "medium" | "hard" | "",
                );
                markDirty();
              }}
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
              onChange={(e) => {
                setTimeMinutes(e.target.value);
                markDirty();
              }}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <FormFieldLabel>Ingredients</FormFieldLabel>
          <textarea
            rows={4}
            value={ingredients ?? ""}
            onChange={(e) => {
              setIngredients(e.target.value);
              markDirty();
            }}
            placeholder="One per line"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <FormFieldLabel>Instructions</FormFieldLabel>
          <textarea
            rows={6}
            value={instructions ?? ""}
            onChange={(e) => {
              setInstructions(e.target.value);
              markDirty();
            }}
            placeholder="Step-by-step"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <InlineTagPicker
          selectedTagIds={tagIds}
          onChange={(ids) => {
            setTagIds(ids);
            markDirty();
          }}
          prefillTagId={prefillTagId}
        />

        <FormError message={error} />
      </div>
    </EntityEditorShell>
  );
}
