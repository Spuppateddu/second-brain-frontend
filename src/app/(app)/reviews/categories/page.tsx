"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiArrowLongLeft,
  HiCheck,
  HiPencilSquare,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import {
  useCreateReviewCategory,
  useDeleteReviewCategory,
  useReviewCategories,
  useUpdateReviewCategory,
} from "@/lib/queries/entities";
import type { ReviewCategoryWithCount } from "@/types/entities";

const PRESET_COLORS = [
  "#2563eb", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#a855f7", // purple
  "#f97316", // orange
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#ec4899", // pink
  "#64748b", // slate
];

function ColorSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESET_COLORS.map((c) => {
        const active = value.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            aria-label={`Select color ${c}`}
            aria-pressed={active}
            style={{ backgroundColor: c }}
            className={[
              "h-7 w-10 rounded-full transition-transform",
              active
                ? "scale-110 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-secondary-950"
                : "ring-1 ring-secondary-200 hover:scale-105 hover:ring-secondary-400 dark:ring-secondary-700 dark:hover:ring-secondary-500",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

function CreateCategoryCard() {
  const create = useCreateReviewCategory();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const canSubmit = name.trim().length > 0 && !create.isPending;

  return (
    <FormSection
      title="Create new category"
      description="A name and a color used to tag reviews."
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) return;
          await create.mutateAsync({ name: name.trim(), color });
          setName("");
          setColor(PRESET_COLORS[0]);
        }}
      >
        <Input
          label="Category name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Books, Games, Anime…"
          fullWidth
        />
        <div>
          <p className="mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Color
          </p>
          <ColorSwatches value={color} onChange={setColor} />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            loading={create.isPending}
          >
            Create category
          </Button>
        </div>
      </form>
    </FormSection>
  );
}

function CategoryRow({ cat }: { cat: ReviewCategoryWithCount }) {
  const update = useUpdateReviewCategory(cat.id);
  const remove = useDeleteReviewCategory();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [color, setColor] = useState(cat.color);

  if (editing) {
    return (
      <li className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
        <Input
          type="text"
          value={name}
          isFocused
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <ColorSwatches value={color} onChange={setColor} />
        <div className="flex justify-end gap-2">
          <IconButton
            size="sm"
            variant="secondary"
            label="Cancel"
            onClick={() => {
              setName(cat.name);
              setColor(cat.color);
              setEditing(false);
            }}
          >
            <HiXMark />
          </IconButton>
          <IconButton
            size="sm"
            variant="primary"
            label="Save"
            disabled={!name.trim() || update.isPending}
            loading={update.isPending}
            onClick={async () => {
              await update.mutateAsync({ name: name.trim(), color });
              setEditing(false);
            }}
          >
            <HiCheck />
          </IconButton>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700">
      <span
        className="h-4 w-4 shrink-0 rounded-full ring-1 ring-secondary-200 dark:ring-secondary-800"
        style={{ backgroundColor: cat.color }}
        aria-hidden
      />
      <span className="flex-1 text-sm font-medium text-secondary-900 dark:text-secondary-100">
        {cat.name}
      </span>
      <span className="text-xs text-secondary-500 dark:text-secondary-400">
        ({cat.reviews_count} reviews)
      </span>
      <IconButton
        size="sm"
        variant="secondary"
        label="Edit"
        onClick={() => setEditing(true)}
      >
        <HiPencilSquare />
      </IconButton>
      <IconButton
        size="sm"
        variant="danger"
        label="Delete"
        onClick={() => {
          if (
            confirm(
              `Delete category "${cat.name}"? Existing reviews will be left uncategorized.`,
            )
          ) {
            remove.mutate(cat.id);
          }
        }}
      >
        <HiTrash />
      </IconButton>
    </li>
  );
}

export default function ManageReviewCategoriesPage() {
  const { data, isLoading, error } = useReviewCategories();

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/reviews">
              <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
                Back to reviews
              </Button>
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
              Manage review categories
            </h1>
          </div>
        </header>

        <CreateCategoryCard />

        <FormSection title="Existing categories">
          {isLoading ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              Loading…
            </p>
          ) : error ? (
            <p className="text-sm text-danger-600 dark:text-danger-400">
              Couldn&rsquo;t load the categories. Try refreshing.
            </p>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              No categories yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.map((cat) => (
                <CategoryRow key={cat.id} cat={cat} />
              ))}
            </ul>
          )}
        </FormSection>
      </div>
    </div>
  );
}
