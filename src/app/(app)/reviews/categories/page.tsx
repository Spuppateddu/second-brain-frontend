"use client";

import Link from "next/link";
import { useState } from "react";
import { HiCheck, HiPencilSquare, HiTrash, HiXMark } from "react-icons/hi2";

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
            style={{ backgroundColor: c }}
            className={[
              "h-7 w-10 rounded-full transition-transform",
              active
                ? "scale-110 ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100"
                : "hover:scale-105",
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
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold">Create New Category</h2>
      <form
        className="mt-4 grid grid-cols-1 items-end gap-4 lg:grid-cols-[1fr_auto_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) return;
          await create.mutateAsync({ name: name.trim(), color });
          setName("");
          setColor(PRESET_COLORS[0]);
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Category Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Books, Games, Anime…"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Color</label>
          <ColorSwatches value={color} onChange={setColor} />
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {create.isPending ? "Creating…" : "Create Category"}
        </button>
      </form>
    </section>
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
      <li className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
          <ColorSwatches value={color} onChange={setColor} />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setName(cat.name);
              setColor(cat.color);
              setEditing(false);
            }}
            className="rounded p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Cancel"
          >
            <HiXMark className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={!name.trim() || update.isPending}
            onClick={async () => {
              await update.mutateAsync({ name: name.trim(), color });
              setEditing(false);
            }}
            className="rounded p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-900/20"
            title="Save"
          >
            <HiCheck className="h-5 w-5" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <span
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: cat.color }}
      />
      <span className="flex-1 text-sm font-medium">{cat.name}</span>
      <span className="text-xs text-zinc-500">({cat.reviews_count} reviews)</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        title="Edit"
      >
        <HiPencilSquare className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (
            confirm(
              `Delete category "${cat.name}"? Existing reviews will be left uncategorized.`,
            )
          ) {
            remove.mutate(cat.id);
          }
        }}
        className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        title="Delete"
      >
        <HiTrash className="h-4 w-4" />
      </button>
    </li>
  );
}

export default function ManageReviewCategoriesPage() {
  const { data, isLoading, error } = useReviewCategories();

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Manage Review Categories</h1>
        <Link
          href="/reviews"
          className="inline-flex items-center rounded-md bg-zinc-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600"
        >
          Back to Reviews
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <CreateCategoryCard />

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Existing Categories</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading…</p>
          ) : error ? (
            <p className="mt-4 text-sm text-danger">
              Couldn&rsquo;t load the categories. Try refreshing.
            </p>
          ) : !data || data.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No categories yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {data.map((cat) => (
                <CategoryRow key={cat.id} cat={cat} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
