"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

import { TagPicker } from "@/components/TagPicker";
import type { RecipeInput } from "@/lib/queries/entities";
import type { Recipe } from "@/types/entities";

type Props = {
  initial?: Recipe;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: RecipeInput) => Promise<void>;
};

export function RecipeForm({
  initial,
  submitLabel,
  isPending,
  error,
  onCancel,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [difficulty, setDifficulty] = useState<"" | "easy" | "medium" | "hard">(
    initial?.difficulty ?? "",
  );
  const [timeMinutes, setTimeMinutes] = useState(
    initial?.time_minutes ? String(initial.time_minutes) : "",
  );
  const [steps, setSteps] = useState<string[]>(
    initial?.steps?.length
      ? initial.steps
          .slice()
          .sort((a, b) => a.step_number - b.step_number)
          .map((s) => s.description)
      : [""],
  );
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );

  const valid = title.trim().length > 0;

  function moveStep(i: number, delta: number) {
    const next = i + delta;
    if (next < 0 || next >= steps.length) return;
    setSteps((s) => {
      const copy = s.slice();
      [copy[i], copy[next]] = [copy[next], copy[i]];
      return copy;
    });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const cleanedSteps = steps
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((description) => ({ description }));
        await onSubmit({
          title: title.trim(),
          ingredients: ingredients.trim() || null,
          instructions: instructions.trim() || null,
          difficulty: difficulty === "" ? null : difficulty,
          time_minutes: timeMinutes ? Number(timeMinutes) : null,
          steps: cleanedSteps.length > 0 ? cleanedSteps : undefined,
          tag_ids: tagIds,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Title <span className="text-danger">*</span>
        </span>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Difficulty
          </span>
          <select
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(
                e.target.value as "" | "easy" | "medium" | "hard",
              )
            }
          >
            <option value="">—</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Time (minutes)
          </span>
          <Input
            type="number"
            min={1}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(e.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Ingredients
        </span>
        <textarea
          className="min-h-[100px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={ingredients ?? ""}
          onChange={(e) => setIngredients(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          General instructions
        </span>
        <textarea
          className="min-h-[100px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={instructions ?? ""}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs uppercase tracking-wide text-zinc-500">
          Steps
        </legend>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 w-6 text-right text-xs text-zinc-500">
              {i + 1}.
            </span>
            <textarea
              className="min-h-[60px] flex-1 rounded-lg border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Describe this step…"
              value={step}
              onChange={(e) =>
                setSteps((s) =>
                  s.map((v, idx) => (idx === i ? e.target.value : v)),
                )
              }
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="rounded px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                disabled={i === 0}
                onClick={() => moveStep(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                disabled={i === steps.length - 1}
                onClick={() => moveStep(i, 1)}
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-danger"
              onClick={() =>
                setSteps((s) =>
                  s.length === 1 ? [""] : s.filter((_, idx) => idx !== i),
                )
              }
            >
              ×
            </button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSteps((s) => [...s, ""])}
        >
          + Add step
        </Button>
      </fieldset>
      <TagPicker value={tagIds} onChange={setTagIds} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isDisabled={!valid || isPending}
        >
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
