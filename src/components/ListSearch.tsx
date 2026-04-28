"use client";

import { Input } from "@heroui/react";
import { useState } from "react";

export function useTextFilter<T>(
  items: T[],
  getText: (item: T) => string,
): {
  query: string;
  setQuery: (q: string) => void;
  filtered: T[];
} {
  const [query, setQuery] = useState("");
  const lc = query.trim().toLowerCase();
  const filtered = lc
    ? items.filter((it) => getText(it).toLowerCase().includes(lc))
    : items;
  return { query, setQuery, filtered };
}

export function ListSearchInput({
  value,
  onChange,
  placeholder = "Filter…",
  count,
  total,
}: {
  value: string;
  onChange: (q: string) => void;
  placeholder?: string;
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <span className="shrink-0 text-xs text-zinc-500">
        {value.trim() ? `${count} of ${total}` : `${total} total`}
      </span>
    </div>
  );
}
