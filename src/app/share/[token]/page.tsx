"use client";

import { use } from "react";

import { TagChip } from "@/components/EntityListShell";
import { env } from "@/lib/env";
import { useSharedEntity } from "@/lib/queries/entities";
import type { Tag } from "@/types/entities";

const DATE = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function fieldString(
  entity: Record<string, unknown>,
  key: string,
): string | null {
  const v = entity[key];
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function fieldHtml(
  entity: Record<string, unknown>,
  key: string,
): string | null {
  return fieldString(entity, key);
}

function tagsOf(entity: Record<string, unknown>): Tag[] {
  const t = entity.tags;
  return Array.isArray(t) ? (t as Tag[]) : [];
}

function PrimaryName(entity: Record<string, unknown>): string {
  return (
    fieldString(entity, "title") ??
    fieldString(entity, "name") ??
    "Untitled"
  );
}

function NoteBody({ entity }: { entity: Record<string, unknown> }) {
  const html = fieldHtml(entity, "content");
  if (!html) return <p className="text-sm text-zinc-500">Empty note.</p>;
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function RecipeBody({ entity }: { entity: Record<string, unknown> }) {
  const ingredients = fieldString(entity, "ingredients");
  const instructions = fieldString(entity, "instructions");
  const steps = Array.isArray(entity.steps)
    ? (entity.steps as { id: number; description: string; step_number: number }[])
    : [];
  const sortedSteps = steps
    .slice()
    .sort((a, b) => a.step_number - b.step_number);

  return (
    <div className="flex flex-col gap-4">
      {ingredients ? (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Ingredients
          </h3>
          <p className="whitespace-pre-wrap text-sm">{ingredients}</p>
        </section>
      ) : null}
      {instructions ? (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Instructions
          </h3>
          <p className="whitespace-pre-wrap text-sm">{instructions}</p>
        </section>
      ) : null}
      {sortedSteps.length > 0 ? (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Steps
          </h3>
          <ol className="ml-5 list-decimal text-sm">
            {sortedSteps.map((s) => (
              <li key={s.id} className="mt-1">
                {s.description}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function PlaceBody({ entity }: { entity: Record<string, unknown> }) {
  const url = fieldString(entity, "url");
  const description = fieldString(entity, "description");
  return (
    <div className="flex flex-col gap-2 text-sm">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {url}
        </a>
      ) : null}
      {description ? (
        <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function PersonBody({ entity }: { entity: Record<string, unknown> }) {
  const description = fieldString(entity, "description");
  const birth = fieldString(entity, "birth_date");
  return (
    <div className="flex flex-col gap-2 text-sm">
      {birth ? (
        <span className="text-xs text-zinc-500">Born {birth}</span>
      ) : null}
      {description ? (
        <p className="whitespace-pre-wrap">{description}</p>
      ) : null}
    </div>
  );
}

function BookmarkBody({ entity }: { entity: Record<string, unknown> }) {
  const url = fieldString(entity, "url");
  const description = fieldString(entity, "description");
  return (
    <div className="flex flex-col gap-2 text-sm">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {url}
        </a>
      ) : null}
      {description ? (
        <p className="whitespace-pre-wrap">{description}</p>
      ) : null}
    </div>
  );
}

function MegaFileBody({ entity }: { entity: Record<string, unknown> }) {
  const link = fieldString(entity, "mega_link");
  const fileType = fieldString(entity, "file_type");
  const fileSize = fieldString(entity, "file_size");
  const description = fieldString(entity, "description");
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="text-xs text-zinc-500">
        {fileType ?? "file"}
        {fileSize ? ` · ${fileSize}` : ""}
      </span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Open on MEGA →
        </a>
      ) : null}
      {description ? (
        <p className="whitespace-pre-wrap">{description}</p>
      ) : null}
    </div>
  );
}

function WishlistBody({ entity }: { entity: Record<string, unknown> }) {
  const link = fieldString(entity, "link");
  const notes = fieldString(entity, "notes");
  const purchased = entity.is_purchased === true;
  return (
    <div className="flex flex-col gap-2 text-sm">
      {purchased ? (
        <span className="text-xs text-zinc-500">Already purchased</span>
      ) : null}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {link}
        </a>
      ) : null}
      {notes ? <p className="whitespace-pre-wrap">{notes}</p> : null}
    </div>
  );
}

function TripBody({ entity }: { entity: Record<string, unknown> }) {
  const start = fieldString(entity, "start_date");
  const end = fieldString(entity, "end_date");
  const description = fieldString(entity, "description");
  return (
    <div className="flex flex-col gap-2 text-sm">
      {start || end ? (
        <span className="text-xs text-zinc-500">
          {start ?? "?"} → {end ?? "?"}
        </span>
      ) : null}
      {description ? (
        <p className="whitespace-pre-wrap">{description}</p>
      ) : null}
    </div>
  );
}

function PlainBody({ entity }: { entity: Record<string, unknown> }) {
  const description = fieldString(entity, "description");
  if (!description) return null;
  return <p className="whitespace-pre-wrap text-sm">{description}</p>;
}

function EntityBody({
  entityType,
  entity,
}: {
  entityType: string;
  entity: Record<string, unknown>;
}) {
  switch (entityType) {
    case "note":
      return <NoteBody entity={entity} />;
    case "recipe":
      return <RecipeBody entity={entity} />;
    case "place":
      return <PlaceBody entity={entity} />;
    case "person":
      return <PersonBody entity={entity} />;
    case "bookmark":
      return <BookmarkBody entity={entity} />;
    case "megafile":
    case "mega_file":
      return <MegaFileBody entity={entity} />;
    case "wishlistitem":
    case "wishlist_item":
      return <WishlistBody entity={entity} />;
    case "trip":
      return <TripBody entity={entity} />;
    case "bag":
    case "hardware":
    case "software":
    default:
      return <PlainBody entity={entity} />;
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-start justify-center p-6">
      <div className="w-full max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold">{env.appName}</span>
          <span className="text-xs text-zinc-500">Shared link</span>
        </header>
        {children}
      </div>
    </div>
  );
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data, isLoading, error } = useSharedEntity(token);

  if (isLoading) {
    return (
      <Frame>
        <p className="text-sm text-zinc-500">Loading…</p>
      </Frame>
    );
  }

  if (error || !data) {
    return (
      <Frame>
        <p className="text-sm text-danger">
          Couldn&rsquo;t load this share link.
        </p>
      </Frame>
    );
  }

  if ("error" in data && typeof data.error === "string") {
    return (
      <Frame>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold">{data.message}</h1>
          {data.description ? (
            <p className="mt-2 text-sm text-zinc-500">{data.description}</p>
          ) : null}
          {data.expiredAt ? (
            <p className="mt-2 text-xs text-zinc-500">
              Expired on {DATE.format(new Date(data.expiredAt))}
            </p>
          ) : null}
        </div>
      </Frame>
    );
  }

  // Narrow: success branch.
  if (!("entity" in data)) {
    return (
      <Frame>
        <p className="text-sm text-danger">Unexpected response.</p>
      </Frame>
    );
  }

  const { entity, entityType, expiresAt } = data;
  const tags = tagsOf(entity);

  return (
    <Frame>
      <article className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">{PrimaryName(entity)}</h1>
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            {entityType.replace("_", " ")}
          </span>
        </div>
        {tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <TagChip key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        ) : null}
        <div className="mt-4">
          <EntityBody entityType={entityType} entity={entity} />
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          This share link expires on {DATE.format(new Date(expiresAt))}.
        </p>
      </article>
    </Frame>
  );
}
