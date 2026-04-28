"use client";

import { Button, Input } from "@heroui/react";
import { useMemo, useState } from "react";

import { useCreateTag, useTags } from "@/lib/queries/entities";
import type { Tag } from "@/types/entities";

const TAG_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f59e0b",
  "#a855f7",
  "#64748b",
  "#14b8a6",
  "#ef4444",
];

function pickRandomColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export function TagPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (tagIds: number[]) => void;
}) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = useMemo(
    () => tags.filter((t) => value.includes(t.id)),
    [tags, value],
  );
  const search_lc = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!search_lc) return [];
    return tags
      .filter((t) => t.name.toLowerCase().includes(search_lc))
      .slice(0, 8);
  }, [tags, search_lc]);
  const exactMatch = matches.some((t) => t.name.toLowerCase() === search_lc);

  function toggle(tag: Tag) {
    if (value.includes(tag.id)) {
      onChange(value.filter((id) => id !== tag.id));
    } else {
      onChange([...value, tag.id]);
    }
  }

  async function createAndSelect() {
    const name = search.trim();
    if (!name) return;
    setCreating(true);
    try {
      const tag = await createTag.mutateAsync({
        name,
        color: pickRandomColor(),
      });
      onChange([...value, tag.id]);
      setSearch("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        Tags
      </span>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <span className="ml-1 text-zinc-500">×</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search or create a tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches.length > 0 && exactMatch) {
                const t = matches.find(
                  (m) => m.name.toLowerCase() === search_lc,
                );
                if (t && !value.includes(t.id)) onChange([...value, t.id]);
                setSearch("");
              } else if (search.trim()) {
                createAndSelect();
              }
            }
          }}
        />
        {search.trim() && !exactMatch ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            isDisabled={creating}
            onClick={createAndSelect}
          >
            + Create
          </Button>
        ) : null}
      </div>
      {matches.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {matches.map((tag) => {
            const active = value.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag)}
                className={[
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-opacity",
                  active ? "" : "opacity-60 hover:opacity-100",
                ].join(" ")}
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                {active ? <span className="ml-1 text-zinc-500">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
