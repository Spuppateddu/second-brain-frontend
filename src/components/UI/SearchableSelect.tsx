"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { HiChevronDown, HiMagnifyingGlass, HiPlus, HiXMark } from "react-icons/hi2";

export type SearchableOption = {
  id: number;
  name: string;
};

type CommonProps = {
  options: SearchableOption[];
  placeholder?: string;
  /** When provided, an "Add <query>" entry shows when the query has no exact match. */
  onCreate?: (name: string) => Promise<SearchableOption>;
  /** Label shown for the create row, e.g. "method", "platform", "type". */
  createNoun?: string;
  disabled?: boolean;
};

type SingleProps = CommonProps & {
  value: number | null;
  onChange: (id: number | null) => void;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  onCreate,
  createNoun,
  disabled,
}: SingleProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useDropdownClose(containerRef, open, () => {
    setOpen(false);
    setQuery("");
    setCreateError(null);
  });

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const selected = options.find((o) => o.id === value) ?? null;
  const filtered = useMemo(
    () => filterOptions(options, query),
    [options, query],
  );
  const exactMatch = useMemo(() => hasExactMatch(options, query), [options, query]);
  const showCreate = Boolean(onCreate) && query.trim().length > 0 && !exactMatch;

  async function handleCreate() {
    if (!onCreate) return;
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await onCreate(name);
      onChange(created.id);
      setOpen(false);
      setQuery("");
    } catch (err) {
      setCreateError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className={selected ? "truncate" : "text-zinc-400 dark:text-zinc-500"}>
          {selected ? selected.name : placeholder}
        </span>
        <span className="ml-2 flex shrink-0 items-center gap-1">
          {selected ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }
              }}
              aria-label="Clear selection"
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <HiXMark className="h-4 w-4" />
            </span>
          ) : null}
          <HiChevronDown
            className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open ? (
        <div className={panelClass}>
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            onEnter={() => {
              if (showCreate) handleCreate();
              else if (filtered.length === 1) {
                onChange(filtered[0].id);
                setOpen(false);
                setQuery("");
              }
            }}
          />
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 && !showCreate ? (
              <p className="px-3 py-2 text-xs text-zinc-500">No options.</p>
            ) : null}
            {filtered.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  opt.id === value ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <span className="truncate">{opt.name}</span>
                {opt.id === value ? (
                  <span className="text-xs text-blue-600 dark:text-blue-300">
                    Selected
                  </span>
                ) : null}
              </button>
            ))}
            {showCreate ? (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 border-t border-zinc-200 px-3 py-2 text-left text-sm text-blue-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:text-blue-300 dark:hover:bg-zinc-800"
              >
                <HiPlus className="h-4 w-4" />
                <span className="truncate">
                  {creating
                    ? `Adding “${query.trim()}”…`
                    : `Add ${createNoun ? `${createNoun} ` : ""}“${query.trim()}”`}
                </span>
              </button>
            ) : null}
          </div>
          {createError ? (
            <p className="border-t border-zinc-200 px-3 py-2 text-xs text-danger dark:border-zinc-800">
              {createError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type MultiProps = CommonProps & {
  value: number[];
  onChange: (ids: number[]) => void;
};

export function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  onCreate,
  createNoun,
  disabled,
}: MultiProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useDropdownClose(containerRef, open, () => {
    setOpen(false);
    setQuery("");
    setCreateError(null);
  });

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = useMemo(
    () => filterOptions(options, query),
    [options, query],
  );
  const exactMatch = useMemo(() => hasExactMatch(options, query), [options, query]);
  const showCreate = Boolean(onCreate) && query.trim().length > 0 && !exactMatch;

  function toggle(id: number) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  async function handleCreate() {
    if (!onCreate) return;
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await onCreate(name);
      if (!value.includes(created.id)) onChange([...value, created.id]);
      setQuery("");
    } catch (err) {
      setCreateError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  const triggerLabel =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? options
            .filter((o) => value.includes(o.id))
            .map((o) => o.name)
            .join(", ")
        : `${value.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={triggerClass}
      >
        <span
          className={value.length === 0 ? "text-zinc-400 dark:text-zinc-500" : "truncate"}
        >
          {triggerLabel}
        </span>
        <HiChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className={panelClass}>
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            onEnter={() => {
              if (showCreate) handleCreate();
            }}
          />
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 && !showCreate ? (
              <p className="px-3 py-2 text-xs text-zinc-500">No options.</p>
            ) : null}
            {filtered.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.id)}
                  onChange={() => toggle(opt.id)}
                />
                <span className="truncate">{opt.name}</span>
              </label>
            ))}
            {showCreate ? (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 border-t border-zinc-200 px-3 py-2 text-left text-sm text-blue-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:text-blue-300 dark:hover:bg-zinc-800"
              >
                <HiPlus className="h-4 w-4" />
                <span className="truncate">
                  {creating
                    ? `Adding “${query.trim()}”…`
                    : `Add ${createNoun ? `${createNoun} ` : ""}“${query.trim()}”`}
                </span>
              </button>
            ) : null}
          </div>
          {createError ? (
            <p className="border-t border-zinc-200 px-3 py-2 text-xs text-danger dark:border-zinc-800">
              {createError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const triggerClass =
  "flex w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const panelClass =
  "absolute left-0 right-0 z-30 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900";

type SearchInputProps = {
  value: string;
  onChange: (next: string) => void;
  onEnter?: () => void;
};

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ value, onChange, onEnter }, ref) {
    return (
      <div className="relative border-b border-zinc-200 dark:border-zinc-800">
        <HiMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          placeholder="Search…"
          className="block w-full bg-transparent px-3 py-2 pl-8 text-sm placeholder-zinc-400 focus:outline-none dark:placeholder-zinc-500"
        />
      </div>
    );
  },
);

function filterOptions(options: SearchableOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.name.toLowerCase().includes(q));
}

function hasExactMatch(options: SearchableOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return options.some((o) => o.name.toLowerCase() === q);
}

function useDropdownClose(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
}

function extractErrorMessage(err: unknown): string {
  const message = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (message) return message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
