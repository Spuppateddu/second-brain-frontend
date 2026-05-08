"use client";

import type { ReactNode } from "react";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function EntityListShell({
  title,
  description,
  isLoading,
  error,
  empty,
  children,
  maxWidth,
  headerActions,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: unknown;
  empty?: boolean;
  children: ReactNode;
  maxWidth?: MaxWidth;
  headerActions?: ReactNode;
}) {
  const inner = (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
          </div>
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
    </>
  );

  if (maxWidth) {
    return (
      <div className="p-4 sm:p-6 lg:py-10">
        <div
          className={`mx-auto flex w-full flex-col gap-4 ${MAX_WIDTH_CLASSES[maxWidth]}`}
        >
          {inner}
        </div>
      </div>
    );
  }

  return <div className="flex flex-col gap-4 p-6">{inner}</div>;
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
