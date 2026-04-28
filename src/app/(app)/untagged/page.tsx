"use client";

import Link from "next/link";

import { EntityListShell } from "@/components/EntityListShell";
import { useUntagged } from "@/lib/queries/heavy";

type Bucket = {
  key: string;
  label: string;
  href: (id: number) => string;
  display: (item: { id: number } & Record<string, unknown>) => string;
};

const BUCKETS: Bucket[] = [
  {
    key: "notes",
    label: "Notes",
    href: (id) => `/notes/${id}`,
    display: (item) => (item.title as string) ?? "Untitled",
  },
  {
    key: "bookmarks",
    label: "Bookmarks",
    href: (id) => `/bookmarks/${id}`,
    display: (item) => (item.title as string) ?? "Untitled",
  },
  {
    key: "places",
    label: "Places",
    href: (id) => `/places/${id}`,
    display: (item) => (item.name as string) ?? "Unnamed",
  },
  {
    key: "persons",
    label: "People",
    href: (id) => `/persons/${id}`,
    display: (item) => (item.name as string) ?? "Unnamed",
  },
  {
    key: "recipes",
    label: "Recipes",
    href: (id) => `/recipes/${id}`,
    display: (item) => (item.title as string) ?? "Untitled",
  },
  {
    key: "wishlist_items",
    label: "Wishlist",
    href: (id) => `/wishlist/${id}`,
    display: (item) => (item.name as string) ?? "Unnamed",
  },
  {
    key: "bags",
    label: "Bags",
    href: (id) => `/bags/${id}`,
    display: (item) => (item.title as string) ?? "Untitled",
  },
  {
    key: "hardware",
    label: "Hardware",
    href: (id) => `/hardware/${id}`,
    display: (item) => (item.title as string) ?? "Untitled",
  },
  {
    key: "software",
    label: "Software",
    href: (id) => `/software/${id}`,
    display: (item) => (item.title as string) ?? "Untitled",
  },
  {
    key: "mega_files",
    label: "Mega Files",
    href: (id) => `/mega-files/${id}`,
    display: (item) => (item.title as string) ?? "Untitled",
  },
  {
    key: "trips",
    label: "Trips",
    href: (id) => `/trips/${id}`,
    display: (item) => (item.name as string) ?? "Unnamed",
  },
];

export default function UntaggedPage() {
  const { data, isLoading, error } = useUntagged();

  const totals =
    data &&
    BUCKETS.reduce(
      (sum, b) =>
        sum +
        ((data as unknown as Record<string, unknown[]>)[b.key]?.length ?? 0),
      0,
    );

  return (
    <EntityListShell
      title="Untagged"
      description={
        totals !== undefined
          ? `${totals} entit${totals === 1 ? "y" : "ies"} have no tags. Tag them so they show up in graph searches.`
          : undefined
      }
      isLoading={isLoading}
      error={error}
      empty={data ? totals === 0 : false}
    >
      {data ? (
        <div className="flex flex-col gap-6">
          {BUCKETS.map((bucket) => {
            const items =
              ((data as unknown as Record<
                string,
                ({ id: number } & Record<string, unknown>)[]
              >)[bucket.key] ?? []);
            if (items.length === 0) return null;
            return (
              <section key={bucket.key} className="flex flex-col gap-2">
                <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {bucket.label} ({items.length})
                </h2>
                <ul className="flex flex-col gap-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-md border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <Link
                        href={bucket.href(item.id)}
                        className="hover:underline"
                      >
                        {bucket.display(item)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}
    </EntityListShell>
  );
}
