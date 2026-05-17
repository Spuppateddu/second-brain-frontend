"use client";

import { use } from "react";
import {
  HiBookmark,
  HiCake,
  HiCloudArrowDown,
  HiCodeBracket,
  HiComputerDesktop,
  HiDocumentText,
  HiGift,
  HiMapPin,
  HiOutlineClock,
  HiPaperAirplane,
  HiShoppingBag,
  HiUser,
} from "react-icons/hi2";

import ApplicationLogo from "@/components/ApplicationLogo";
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

const ENTITY_META: Record<
  string,
  { Icon: typeof HiDocumentText; accent: string }
> = {
  note: {
    Icon: HiDocumentText,
    accent: "from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-400",
  },
  recipe: {
    Icon: HiCake,
    accent: "from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-400",
  },
  place: {
    Icon: HiMapPin,
    accent:
      "from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-400",
  },
  person: {
    Icon: HiUser,
    accent:
      "from-violet-500/15 to-violet-500/0 text-violet-600 dark:text-violet-400",
  },
  bookmark: {
    Icon: HiBookmark,
    accent: "from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-400",
  },
  mega_file: {
    Icon: HiCloudArrowDown,
    accent: "from-cyan-500/15 to-cyan-500/0 text-cyan-600 dark:text-cyan-400",
  },
  wishlist_item: {
    Icon: HiGift,
    accent: "from-pink-500/15 to-pink-500/0 text-pink-600 dark:text-pink-400",
  },
  trip: {
    Icon: HiPaperAirplane,
    accent: "from-blue-500/15 to-blue-500/0 text-blue-600 dark:text-blue-400",
  },
  bag: {
    Icon: HiShoppingBag,
    accent:
      "from-orange-500/15 to-orange-500/0 text-orange-600 dark:text-orange-400",
  },
  hardware: {
    Icon: HiComputerDesktop,
    accent: "from-zinc-500/15 to-zinc-500/0 text-zinc-700 dark:text-zinc-300",
  },
  software: {
    Icon: HiCodeBracket,
    accent:
      "from-indigo-500/15 to-indigo-500/0 text-indigo-600 dark:text-indigo-400",
  },
};

function entityMeta(entityType: string) {
  return (
    ENTITY_META[entityType] ?? {
      Icon: HiDocumentText,
      accent: "from-zinc-500/15 to-zinc-500/0 text-zinc-600 dark:text-zinc-400",
    }
  );
}

function RichHtml({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert sm:prose-base prose-headings:font-semibold prose-a:text-primary-600 dark:prose-a:text-primary-400"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function NoteBody({ entity }: { entity: Record<string, unknown> }) {
  const html = fieldHtml(entity, "content");
  if (!html) return <EmptyState message="This note is empty." />;
  return <RichHtml html={html} />;
}

function RichDescriptionBody({
  entity,
  emptyLabel,
}: {
  entity: Record<string, unknown>;
  emptyLabel: string;
}) {
  const html = fieldHtml(entity, "description");
  if (!html) return <EmptyState message={emptyLabel} />;
  return <RichHtml html={html} />;
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
  const difficulty = fieldString(entity, "difficulty");
  const minutes = typeof entity.time_minutes === "number" ? entity.time_minutes : null;

  if (!ingredients && !instructions && sortedSteps.length === 0 && !difficulty && minutes == null) {
    return <EmptyState message="No recipe details." />;
  }

  return (
    <div className="flex flex-col gap-5">
      {(difficulty || minutes != null) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {difficulty ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {difficulty}
            </span>
          ) : null}
          {minutes != null ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {minutes} min
            </span>
          ) : null}
        </div>
      )}
      {ingredients ? (
        <Section title="Ingredients">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {ingredients}
          </p>
        </Section>
      ) : null}
      {instructions ? (
        <Section title="Instructions">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {instructions}
          </p>
        </Section>
      ) : null}
      {sortedSteps.length > 0 ? (
        <Section title="Steps">
          <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {sortedSteps.map((s) => (
              <li key={s.id}>{s.description}</li>
            ))}
          </ol>
        </Section>
      ) : null}
    </div>
  );
}

function PlaceBody({ entity }: { entity: Record<string, unknown> }) {
  const url = fieldString(entity, "url");
  const description = fieldString(entity, "description");
  if (!url && !description) return <EmptyState message="No details." />;
  return (
    <div className="flex flex-col gap-3 text-sm">
      {url ? <LinkRow href={url} /> : null}
      {description ? <PlainParagraph text={description} /> : null}
    </div>
  );
}

function PersonBody({ entity }: { entity: Record<string, unknown> }) {
  const description = fieldString(entity, "description");
  const birth = fieldString(entity, "birth_date");
  if (!description && !birth) return <EmptyState message="No details." />;
  return (
    <div className="flex flex-col gap-3 text-sm">
      {birth ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Born {birth}
        </span>
      ) : null}
      {description ? <PlainParagraph text={description} /> : null}
    </div>
  );
}

function BookmarkBody({ entity }: { entity: Record<string, unknown> }) {
  const url = fieldString(entity, "url");
  const description = fieldString(entity, "description");
  if (!url && !description) return <EmptyState message="No details." />;
  return (
    <div className="flex flex-col gap-3 text-sm">
      {url ? <LinkRow href={url} /> : null}
      {description ? <PlainParagraph text={description} /> : null}
    </div>
  );
}

function MegaFileBody({ entity }: { entity: Record<string, unknown> }) {
  const link = fieldString(entity, "mega_link");
  const fileType = fieldString(entity, "file_type");
  const fileSize = fieldString(entity, "file_size");
  const description = fieldString(entity, "description");
  return (
    <div className="flex flex-col gap-3 text-sm">
      {(fileType || fileSize) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {fileType ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {fileType}
            </span>
          ) : null}
          {fileSize ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {fileSize}
            </span>
          ) : null}
        </div>
      )}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <HiCloudArrowDown className="h-4 w-4" />
          Open on MEGA
        </a>
      ) : null}
      {description ? <PlainParagraph text={description} /> : null}
    </div>
  );
}

function WishlistBody({ entity }: { entity: Record<string, unknown> }) {
  const link = fieldString(entity, "link");
  const notes = fieldString(entity, "notes");
  const purchased = entity.is_purchased === true;
  const price = entity.price;
  if (!link && !notes && !purchased && price == null) {
    return <EmptyState message="No details." />;
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap gap-2 text-xs">
        {purchased ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Already purchased
          </span>
        ) : null}
        {price != null ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {String(price)}
          </span>
        ) : null}
      </div>
      {link ? <LinkRow href={link} /> : null}
      {notes ? <PlainParagraph text={notes} /> : null}
    </div>
  );
}

function TripBody({ entity }: { entity: Record<string, unknown> }) {
  const planWithoutTime = fieldHtml(entity, "plan_without_time");
  const plan = fieldHtml(entity, "plan");
  const notes = fieldHtml(entity, "notes");
  const bag = fieldHtml(entity, "bag");
  const sections: { label: string; html: string }[] = [
    planWithoutTime ? { label: "Plan without time", html: planWithoutTime } : null,
    plan ? { label: "Plan", html: plan } : null,
    notes ? { label: "Notes", html: notes } : null,
    bag ? { label: "Bag", html: bag } : null,
  ].filter((s): s is { label: string; html: string } => s !== null);

  if (sections.length === 0) return <EmptyState message="No trip details." />;
  return (
    <div className="flex flex-col gap-5">
      {sections.map((s) => (
        <Section key={s.label} title={s.label}>
          <RichHtml html={s.html} />
        </Section>
      ))}
    </div>
  );
}

function PlainBody({ entity }: { entity: Record<string, unknown> }) {
  const description = fieldString(entity, "description");
  if (!description) return <EmptyState message="No description." />;
  return <PlainParagraph text={description} />;
}

function PlainParagraph({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      {text}
    </p>
  );
}

function LinkRow({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex w-fit max-w-full items-center gap-2 break-all rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-primary-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800"
    >
      <span className="truncate group-hover:underline">{href}</span>
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm italic text-zinc-400 dark:text-zinc-600">{message}</p>
  );
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
      return <RichDescriptionBody entity={entity} emptyLabel="Empty bag." />;
    case "hardware":
      return <RichDescriptionBody entity={entity} emptyLabel="No description." />;
    case "software":
      return <RichDescriptionBody entity={entity} emptyLabel="No description." />;
    default:
      return <PlainBody entity={entity} />;
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary-500/10 to-transparent dark:from-primary-400/10"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex items-center gap-2">
          <ApplicationLogo className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
            {env.appName}
          </span>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-8 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          Shared via {env.appName}
        </footer>
      </div>
    </div>
  );
}

function StateCard({
  title,
  message,
  tone = "neutral",
}: {
  title: string;
  message?: string;
  tone?: "neutral" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger-200 bg-danger-50/60 text-danger-700 dark:border-danger-900 dark:bg-danger-950/30 dark:text-danger-300"
      : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300";
  return (
    <div
      className={`rounded-2xl border p-8 text-center shadow-sm ${toneClass}`}
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      {message ? <p className="mt-2 text-sm opacity-80">{message}</p> : null}
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
        <StateCard title="Loading…" />
      </Frame>
    );
  }

  if (error || !data) {
    return (
      <Frame>
        <StateCard
          title="Couldn't load this share link"
          message="It may have expired or been revoked."
          tone="danger"
        />
      </Frame>
    );
  }

  if ("error" in data && typeof data.error === "string") {
    return (
      <Frame>
        <StateCard
          title={data.message ?? "Share link unavailable"}
          message={
            data.description ??
            (data.expiredAt
              ? `Expired on ${DATE.format(new Date(data.expiredAt))}.`
              : undefined)
          }
          tone="danger"
        />
      </Frame>
    );
  }

  if (!("entity" in data)) {
    return (
      <Frame>
        <StateCard title="Unexpected response" tone="danger" />
      </Frame>
    );
  }

  const { entity, entityType, expiresAt } = data;
  const tags = tagsOf(entity);
  const meta = entityMeta(entityType);
  const Icon = meta.Icon;
  const name = PrimaryName(entity);

  return (
    <Frame>
      <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div
          className={`relative flex items-center gap-3 bg-gradient-to-br px-5 py-5 sm:gap-4 sm:px-7 sm:py-6 ${meta.accent}`}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900/80 dark:ring-zinc-800 sm:h-12 sm:w-12">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <h1 className="min-w-0 truncate text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {name}
          </h1>
        </div>

        <div className="flex flex-col gap-5 border-t border-zinc-200 px-5 py-6 dark:border-zinc-800 sm:px-7 sm:py-7">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          ) : null}
          <EntityBody entityType={entityType} entity={entity} />
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-200 bg-zinc-50/50 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 sm:px-7">
          <HiOutlineClock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Expires {DATE.format(new Date(expiresAt))}</span>
        </div>
      </article>
    </Frame>
  );
}
