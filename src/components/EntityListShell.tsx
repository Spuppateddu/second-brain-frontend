"use client";

import type { ReactNode } from "react";

export function EntityListShell({
  title,
  description,
  isLoading,
  error,
  empty,
  children,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: unknown;
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="text-sm text-zinc-500">{description}</p>
        ) : null}
      </header>
      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the data. Try refreshing.
        </p>
      ) : empty ? (
        <p className="text-sm text-zinc-500">Nothing to show yet.</p>
      ) : (
        children
      )}
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

export function TagChip({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
