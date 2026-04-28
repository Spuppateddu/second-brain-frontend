"use client";

import Link from "next/link";
import { use } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import {
  useDisconnectTags,
  useTag,
  type TagWithRelations,
} from "@/lib/queries/entities";

const SECTIONS: {
  key: keyof Pick<
    TagWithRelations,
    | "notes"
    | "bookmarks"
    | "places"
    | "persons"
    | "recipes"
    | "wishlistItems"
    | "bags"
    | "hardware"
    | "software"
    | "megaFiles"
    | "trips"
  >;
  label: string;
  href: (id: number) => string;
}[] = [
  { key: "notes", label: "Notes", href: (id) => `/notes/${id}` },
  { key: "bookmarks", label: "Bookmarks", href: (id) => `/bookmarks/${id}` },
  { key: "places", label: "Places", href: (id) => `/places/${id}` },
  { key: "persons", label: "People", href: (id) => `/persons/${id}` },
  { key: "recipes", label: "Recipes", href: (id) => `/recipes/${id}` },
  {
    key: "wishlistItems",
    label: "Wishlist",
    href: (id) => `/wishlist/${id}`,
  },
  { key: "bags", label: "Bags", href: (id) => `/bags/${id}` },
  { key: "hardware", label: "Hardware", href: (id) => `/hardware/${id}` },
  { key: "software", label: "Software", href: (id) => `/software/${id}` },
  {
    key: "megaFiles",
    label: "Mega Files",
    href: (id) => `/mega-files/${id}`,
  },
  { key: "trips", label: "Trips", href: (id) => `/trips/${id}` },
];

function display(item: { title?: string; name?: string; id: number }): string {
  return item.title ?? item.name ?? `#${item.id}`;
}

function totalEntities(tag: TagWithRelations): number {
  return SECTIONS.reduce((sum, s) => sum + (tag[s.key]?.length ?? 0), 0);
}

function TagDetail({ tag }: { tag: TagWithRelations }) {
  const disconnect = useDisconnectTags();
  const total = totalEntities(tag);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <h1 className="text-2xl font-semibold">{tag.name}</h1>
        </div>
        {tag.description ? (
          <p className="text-sm text-zinc-500">{tag.description}</p>
        ) : null}
        <div className="flex gap-4 text-xs text-zinc-500">
          <span>{total} tagged item{total === 1 ? "" : "s"}</span>
          <span>
            {tag.connected_tags.length} connected tag
            {tag.connected_tags.length === 1 ? "" : "s"}
          </span>
        </div>
        {tag.connected_tags.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Connected tags
            </span>
            <div className="flex flex-wrap gap-1">
              {tag.connected_tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                  style={{ backgroundColor: `${t.color}20`, color: t.color }}
                >
                  <Link href={`/tags/${t.id}`} className="hover:underline">
                    {t.name}
                  </Link>
                  <button
                    type="button"
                    disabled={disconnect.isPending}
                    onClick={() => {
                      if (
                        !confirm(`Disconnect "${tag.name}" from "${t.name}"?`)
                      )
                        return;
                      disconnect.mutate({ tag_id_1: tag.id, tag_id_2: t.id });
                    }}
                    className="text-zinc-500 hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {SECTIONS.map((section) => {
        const items = tag[section.key] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={section.key} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {section.label} ({items.length})
            </h2>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <Link
                    href={section.href(item.id)}
                    className="hover:underline"
                  >
                    {display(item)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {total === 0 && tag.connected_tags.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing tagged with this yet. Open any entity and pick this tag from
          the tag picker.
        </p>
      ) : null}
    </div>
  );
}

export default function TagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tagId = Number(id);
  const { data, isLoading, error } = useTag(
    Number.isNaN(tagId) ? null : tagId,
  );

  if (Number.isNaN(tagId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid tag id.</p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Tag · ${data.name}` : "Tag"}
      isLoading={isLoading}
      error={error}
    >
      {data ? <TagDetail tag={data} /> : null}
    </EntityListShell>
  );
}
