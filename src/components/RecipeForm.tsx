"use client";

import { useState } from "react";
import {
  HiArrowLongDown,
  HiArrowLongUp,
  HiPlus,
  HiXMark,
} from "react-icons/hi2";

import { TagPicker } from "@/components/TagPicker";
import { Button } from "@/components/UI/Button";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
import { Textarea } from "@/components/UI/Textarea";
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
      <Input
        label="Title *"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        isFocused
        fullWidth
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Difficulty"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as "" | "easy" | "medium" | "hard")
          }
          fullWidth
        >
          <option value="">—</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
        <Input
          label="Time (minutes)"
          type="number"
          min={1}
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(e.target.value)}
          fullWidth
        />
      </div>
      <Textarea
        label="Ingredients"
        value={ingredients ?? ""}
        onChange={(e) => setIngredients(e.target.value)}
        className="min-h-[100px]"
        fullWidth
      />
      <Textarea
        label="General instructions"
        value={instructions ?? ""}
        onChange={(e) => setInstructions(e.target.value)}
        className="min-h-[100px]"
        fullWidth
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Steps
        </legend>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 w-6 text-right text-xs text-secondary-500 dark:text-secondary-400">
              {i + 1}.
            </span>
            <Textarea
              placeholder="Describe this step…"
              value={step}
              onChange={(e) =>
                setSteps((s) =>
                  s.map((v, idx) => (idx === i ? e.target.value : v)),
                )
              }
              className="min-h-[60px] flex-1"
              fullWidth
            />
            <div className="flex flex-col gap-1">
              <IconButton
                size="xs"
                variant="ghost"
                label="Move up"
                disabled={i === 0}
                onClick={() => moveStep(i, -1)}
              >
                <HiArrowLongUp />
              </IconButton>
              <IconButton
                size="xs"
                variant="ghost"
                label="Move down"
                disabled={i === steps.length - 1}
                onClick={() => moveStep(i, 1)}
              >
                <HiArrowLongDown />
              </IconButton>
            </div>
            <IconButton
              size="xs"
              variant="danger"
              label="Remove step"
              onClick={() =>
                setSteps((s) =>
                  s.length === 1 ? [""] : s.filter((_, idx) => idx !== i),
                )
              }
            >
              <HiXMark />
            </IconButton>
          </div>
        ))}
        <div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<HiPlus className="h-4 w-4" />}
            onClick={() => setSteps((s) => [...s, ""])}
          >
            Add step
          </Button>
        </div>
      </fieldset>
      <TagPicker value={tagIds} onChange={setTagIds} />
      {error ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!valid || isPending}
          loading={isPending}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
