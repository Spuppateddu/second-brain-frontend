"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiArrowTopRightOnSquare,
  HiArrowsPointingOut,
  HiBookmark,
  HiCheck,
  HiChevronDown,
  HiClipboardDocumentList,
  HiClock,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiEye,
  HiFilm,
  HiHome,
  HiNewspaper,
  HiPencilSquare,
  HiPlay,
  HiPlus,
  HiShoppingCart,
  HiTrash,
  HiVideoCamera,
} from "react-icons/hi2";
import type { IconType } from "react-icons";

import { useEntityModals } from "@/components/SecondBrain/EntityModalsProvider";
import { TaskModal } from "@/components/calendar/TaskModal";
import {
  entityFullPagePath,
  fetchEntityForEdit,
} from "@/lib/entity-fetch";
import {
  useCalendarAnchors,
  type CalendarAnchor,
} from "@/lib/queries/entity-anchors";

import {
  useMedia,
  useToggleWishlistPurchased,
  useWishlist,
} from "@/lib/queries/entities";
import {
  useAddYoutubeByUrl,
  useCalendarBudgets,
  usePlanningUnlinked,
  useRssNews,
  useToggleYoutubeVideoWatchlist,
  useToggleYoutubeWatched,
  useTwitchLive,
  useUpdateYoutubeProgress,
  useYoutubeWatchlist,
} from "@/lib/queries/heavy";
import type {
  CalendarBudgetRow,
  PlanningTaskUnlinked,
  RssNewsItem,
  TwitchLiveStream,
  YoutubeVideo,
} from "@/types/heavy";
import type { MediaTask, WishlistItem } from "@/types/entities";

type SectionKey =
  | "budget"
  | "entities"
  | "wishlist"
  | "media"
  | "planning"
  | "youtube"
  | "twitch"
  | "rss";

type SectionDef = {
  key: SectionKey;
  label: string;
  icon: IconType;
  privilege?: string;
};

const ALL_SECTIONS: SectionDef[] = [
  {
    key: "planning",
    label: "Planning",
    icon: HiClipboardDocumentList,
  },
  {
    key: "budget",
    label: "Budget",
    icon: HiCurrencyDollar,
    privilege: "cashflow_track",
  },
  { key: "entities", label: "Entities", icon: HiBookmark },
  { key: "wishlist", label: "Wishlist", icon: HiShoppingCart },
  { key: "media", label: "Media", icon: HiFilm },
  {
    key: "youtube",
    label: "YouTube",
    icon: HiPlay,
    privilege: "youtube_track",
  },
  {
    key: "twitch",
    label: "Twitch",
    icon: HiVideoCamera,
    privilege: "twitch_track",
  },
  { key: "rss", label: "News", icon: HiNewspaper, privilege: "rss_news" },
];

// ── Section components ─────────────────────────────────────────────────────

function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function BudgetSection({ budgets }: { budgets: CalendarBudgetRow[] }) {
  if (budgets.length === 0) {
    return <p className="text-sm text-secondary-500">No active budgets.</p>;
  }
  return (
    <ul className="space-y-2">
      {budgets.map((b) => (
        <BudgetRow key={b.id} budget={b} />
      ))}
    </ul>
  );
}

function BudgetRow({ budget }: { budget: CalendarBudgetRow }) {
  const pct = Math.max(0, Math.min(100, budget.percentage));
  const over = budget.is_over_threshold;
  const exceeded = budget.amount_left < 0;
  const barColor = exceeded
    ? "bg-danger-500"
    : over
      ? "bg-amber-500"
      : "bg-success-500";

  return (
    <li
      className={[
        "rounded-lg border p-3 text-sm",
        exceeded
          ? "border-danger-500/40 bg-danger-500/5"
          : over
            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
            : "border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-950",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{budget.name}</p>
          <p className="text-xs uppercase tracking-wide text-secondary-500">
            {budget.type} · {budget.payments_count} payment
            {budget.payments_count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end">
          <span className={exceeded ? "font-semibold text-danger-600" : "font-semibold"}>
            {fmtMoney(budget.total_spent)} / {fmtMoney(budget.amount)}
          </span>
          <span
            className={[
              "text-xs",
              exceeded
                ? "text-danger-600"
                : over
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-secondary-500",
            ].join(" ")}
          >
            {exceeded
              ? `${fmtMoney(Math.abs(budget.amount_left))} over`
              : `${fmtMoney(budget.amount_left)} left`}{" "}
            · {budget.percentage}%
          </span>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-800">
        <div
          className={["h-full transition-all", barColor].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function EntitiesSection({ items }: { items: CalendarAnchor[] }) {
  const router = useRouter();
  const modals = useEntityModals();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-secondary-500">
        No anchored entities. Open any entity and click the bookmark icon to
        anchor it here.
      </p>
    );
  }

  async function openInModal(item: CalendarAnchor) {
    const key = `${item.type}-${item.id}`;
    setBusyKey(key);
    try {
      const entity = await fetchEntityForEdit<
        Parameters<typeof modals.openEdit>[1]
      >(item.type, item.id);
      if (entity) modals.openEdit(item.type, entity);
    } finally {
      setBusyKey(null);
    }
  }

  function openFullPage(item: CalendarAnchor) {
    const path = entityFullPagePath(item.type, item.id);
    if (path) router.push(path);
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const key = `${item.type}-${item.id}`;
        const busy = busyKey === key;
        return (
          <li
            key={key}
            className="flex items-center justify-between gap-3 rounded-md border border-secondary-200 bg-white p-3 text-sm dark:border-secondary-800 dark:bg-secondary-950"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-xs uppercase tracking-wide text-secondary-500">
                {item.type.replace("_", " ")}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => openInModal(item)}
                disabled={busy}
                title="Open in modal"
                aria-label="Open in modal"
                className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-secondary-200 bg-white p-1.5 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800"
              >
                <HiPencilSquare className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openFullPage(item)}
                title="Open full page"
                aria-label="Open full page"
                className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-secondary-200 bg-white p-1.5 text-secondary-600 hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800"
              >
                <HiArrowsPointingOut className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WishlistSection({ items }: { items: WishlistItem[] }) {
  const togglePurchased = useToggleWishlistPurchased();

  if (items.length === 0) {
    return (
      <p className="text-sm text-secondary-500">
        Nothing to buy now. Items are listed once their planned purchase date
        is today or earlier.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((w) => {
        const price =
          w.price == null ? null : Number(w.price);
        return (
          <li
            key={w.id}
            className="flex items-center justify-between gap-3 rounded-md border border-secondary-200 bg-white p-3 text-sm dark:border-secondary-800 dark:bg-secondary-950"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{w.name}</p>
              <p className="text-xs text-secondary-500">
                {w.planned_purchase_date
                  ? formatLocaleDate(w.planned_purchase_date)
                  : "No planned date"}
                {price != null && !Number.isNaN(price)
                  ? ` · ${fmtMoney(price)}`
                  : ""}
              </p>
              {w.notes && (
                <p className="mt-1 truncate text-xs text-secondary-500">{w.notes}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {w.link && (
                <a
                  href={w.link}
                  target="_blank"
                  rel="noreferrer"
                  title="Open link"
                  aria-label="Open buy link"
                  className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-secondary-200 bg-white p-1.5 text-secondary-600 hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800"
                >
                  <HiArrowTopRightOnSquare className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => togglePurchased.mutate(w.id)}
                disabled={togglePurchased.isPending}
                className="inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-success-100 px-2.5 py-1.5 text-xs font-medium text-success-700 hover:bg-success-200 disabled:opacity-50 dark:bg-success-900/30 dark:text-success-300 dark:hover:bg-success-900/50"
              >
                <HiCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Mark bought</span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MediaSection({ items }: { items: MediaTask[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-secondary-500">Watchlist is empty.</p>;
  }
  return (
    <ul className="grid grid-cols-[max-content_1fr] gap-y-2">
      {items.map((m) => (
        <li
          key={m.id}
          className="col-span-2 grid grid-cols-subgrid items-start gap-x-3 rounded-lg border border-secondary-200 bg-white p-3 transition-shadow duration-200 hover:shadow-md dark:border-secondary-600 dark:bg-secondary-700"
        >
          <div>
            {m.review_category && (
              <span
                className="inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                style={
                  m.review_category.color
                    ? {
                        backgroundColor: `${m.review_category.color}20`,
                        color: m.review_category.color,
                      }
                    : undefined
                }
              >
                {m.review_category.name}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h4
              className={[
                "truncate font-semibold",
                m.is_done
                  ? "text-secondary-500 line-through dark:text-secondary-400"
                  : "text-secondary-900 dark:text-secondary-100",
              ].join(" ")}
            >
              {m.title}
            </h4>
            {m.description && (
              <p className="mt-1 text-xs text-secondary-500 line-clamp-2 dark:text-secondary-400">
                {m.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatLocaleDate(date: string): string {
  const justDate = date.slice(0, 10);
  return new Date(`${justDate}T00:00:00`).toLocaleDateString("en-GB");
}

function PlanningSection({
  tasks,
}: {
  tasks: PlanningTaskUnlinked[];
}) {
  const [openTask, setOpenTask] = useState<PlanningTaskUnlinked | null>(null);

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-secondary-500">No unlinked planning tasks.</p>
    );
  }

  const planningPeriod =
    openTask &&
    openTask.start_date &&
    openTask.end_date &&
    openTask.planning_type_id != null
      ? {
          start_date: openTask.start_date,
          end_date: openTask.end_date,
          planning_type_id: openTask.planning_type_id,
        }
      : undefined;

  return (
    <div className="grid grid-cols-[max-content_1fr] gap-y-2">
      {tasks.map((task) => {
        const categories = task.taskCategories ?? task.task_categories ?? [];
        return (
          <button
            type="button"
            key={task.id}
            onClick={() => setOpenTask(task)}
            className="col-span-2 grid grid-cols-subgrid items-center gap-x-3 rounded-lg border border-secondary-200 bg-white p-3 text-left transition-shadow duration-200 hover:shadow-md dark:border-secondary-600 dark:bg-secondary-700"
          >
            <div className="whitespace-nowrap text-xs font-bold text-yellow-500 dark:text-yellow-400">
              {task.stars ? "★".repeat(task.stars) : ""}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h4 className="min-w-0 truncate font-semibold text-secondary-900 dark:text-secondary-100">
                {task.content}
              </h4>
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  style={{
                    backgroundColor: `${c.color}20`,
                    color: c.color,
                  }}
                >
                  {c.name}
                </span>
              ))}
            </div>
          </button>
        );
      })}

      <TaskModal
        open={openTask !== null}
        onClose={() => setOpenTask(null)}
        mode="planning"
        planningTask={openTask}
        planningPeriod={planningPeriod}
      />
    </div>
  );
}

function formatPublishedDate(publishedAt: string): string {
  const date = new Date(publishedAt);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatProgressSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseProgressInput(input: string): number | null {
  const parts = input.split(":").map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

function buildResumeUrl(videoUrl: string, progressSeconds: number): string {
  try {
    const u = new URL(videoUrl);
    u.searchParams.set("t", `${progressSeconds}s`);
    return u.toString();
  } catch {
    const sep = videoUrl.includes("?") ? "&" : "?";
    return `${videoUrl}${sep}t=${progressSeconds}s`;
  }
}

function YouTubeSection({ videos }: { videos: YoutubeVideo[] }) {
  const toggleWatched = useToggleYoutubeWatched();
  const toggleWatchlist = useToggleYoutubeVideoWatchlist();
  const addByUrl = useAddYoutubeByUrl();
  const updateProgress = useUpdateYoutubeProgress();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  function startEditing(video: YoutubeVideo) {
    setEditingId(video.id);
    setEditingValue(
      video.progress_seconds
        ? formatProgressSeconds(video.progress_seconds)
        : "",
    );
  }

  function commitProgress(video: YoutubeVideo) {
    const trimmed = editingValue.trim();
    let parsed = trimmed === "" ? null : parseProgressInput(trimmed);
    if (trimmed !== "" && parsed === null) {
      setEditingId(null);
      return;
    }
    if (parsed != null && video.duration_seconds && parsed >= video.duration_seconds) {
      parsed = video.duration_seconds - 1;
    }
    if (parsed != null && parsed < 0) parsed = 0;
    if (parsed !== (video.progress_seconds ?? null)) {
      updateProgress.mutate({ videoId: video.id, progressSeconds: parsed });
    }
    setEditingId(null);
  }

  async function handleAdd() {
    const trimmed = url.trim();
    if (!trimmed || addByUrl.isPending) return;
    setError(null);
    try {
      await addByUrl.mutateAsync(trimmed);
      setUrl("");
    } catch (e) {
      const data = (e as { response?: { data?: { error?: string } } }).response
        ?.data;
      setError(data?.error ?? "Failed to add video.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 border-b border-secondary-200 pb-3 dark:border-secondary-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !addByUrl.isPending) handleAdd();
            }}
            placeholder="Paste YouTube video URL here..."
            disabled={addByUrl.isPending}
            className="flex-1 rounded-md border border-secondary-300 bg-white px-3 py-1.5 text-sm text-secondary-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200/40 disabled:bg-secondary-100 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={addByUrl.isPending || !url.trim()}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
            aria-label="Add video"
          >
            <HiPlus className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <p className="flex items-center text-sm text-red-600">
            <HiExclamationCircle className="mr-1 h-4 w-4" />
            {error}
          </p>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="py-8 text-center text-secondary-500 dark:text-secondary-400">
          <HiVideoCamera className="mx-auto mb-3 h-12 w-12 text-secondary-400" />
          <p>No videos in watchlist</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => {
            const channel = video.youtube_channel ?? video.youtubeChannel;
            const duration = video.human_duration ?? video.duration ?? null;
            return (
              <div
                key={video.id}
                className="rounded-lg border border-secondary-200 bg-white p-3 transition-all duration-200 hover:shadow-md dark:border-secondary-600 dark:bg-secondary-700 sm:p-4"
              >
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0">
                  <div className="flex-shrink-0 self-start">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-secondary-200 sm:h-16 sm:w-24">
                      {video.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {duration && (
                        <div className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-xs text-white">
                          {duration}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={[
                        "mb-2 line-clamp-2 text-base font-semibold",
                        video.is_watched
                          ? "text-secondary-600 dark:text-secondary-400"
                          : "text-secondary-900 dark:text-secondary-100",
                      ].join(" ")}
                    >
                      {video.title}
                    </h4>
                    {(video.stars ?? 0) > 0 && (
                      <p className="mb-2 text-xs text-yellow-500 dark:text-yellow-400">
                        {"★".repeat(video.stars ?? 0)}
                      </p>
                    )}
                    <div className="flex flex-col text-sm text-secondary-600 dark:text-secondary-400 sm:flex-row sm:items-center">
                      <div className="flex items-center">
                        {channel ? (
                          <>
                            <a
                              href={channel.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-red-600 hover:underline dark:text-red-400"
                            >
                              {channel.name}
                            </a>
                            <a
                              href={`/youtube?search=${encodeURIComponent(channel.name)}`}
                              className="ml-2 text-secondary-500 hover:text-red-600 dark:hover:text-red-400"
                              title="Channel details"
                            >
                              <HiHome className="h-4 w-4" />
                            </a>
                          </>
                        ) : (
                          <span className="font-medium text-red-600 dark:text-red-400">
                            Unknown channel
                          </span>
                        )}
                        <span className="mx-2">•</span>
                        <span>{formatPublishedDate(video.published_at)}</span>
                      </div>
                      {duration && (
                        <div className="flex items-center sm:ml-2">
                          <span className="mx-2 hidden sm:inline">•</span>
                          <span className="flex items-center">
                            <HiClock className="mr-1 h-4 w-4" />
                            {editingId === video.id ? (
                              <>
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) =>
                                    setEditingValue(e.target.value)
                                  }
                                  onBlur={() => commitProgress(video)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      commitProgress(video);
                                    } else if (e.key === "Escape") {
                                      e.preventDefault();
                                      setEditingId(null);
                                    }
                                  }}
                                  placeholder={
                                    video.duration_seconds &&
                                    video.duration_seconds >= 3600
                                      ? "h:mm:ss"
                                      : "mm:ss"
                                  }
                                  autoFocus
                                  className="w-24 rounded border border-red-300 bg-white px-1.5 py-0.5 text-sm text-secondary-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-700 dark:bg-secondary-800 dark:text-secondary-100"
                                />
                                <span className="ml-1">/ {duration}</span>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(video)}
                                title="Click to set where you left off"
                                className="cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                              >
                                {video.progress_seconds
                                  ? `${formatProgressSeconds(video.progress_seconds)} / `
                                  : ""}
                                {duration}
                              </button>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-2">
                    <button
                      type="button"
                      onClick={() => toggleWatched.mutate(video.id)}
                      disabled={toggleWatched.isPending}
                      title={video.is_watched ? "Watched" : "Mark Watched"}
                      aria-label={
                        video.is_watched ? "Watched" : "Mark Watched"
                      }
                      className={[
                        "inline-flex items-center justify-center rounded-md border p-1.5 text-sm font-medium disabled:opacity-50",
                        video.is_watched
                          ? "border-success-300 bg-success-50 text-success-700 hover:bg-success-100 dark:border-success-800 dark:bg-success-900/20 dark:text-success-300 dark:hover:bg-success-900/40"
                          : "border-secondary-300 bg-secondary-50 text-secondary-700 hover:bg-secondary-100 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600",
                      ].join(" ")}
                    >
                      <HiCheck className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = video.progress_seconds
                          ? buildResumeUrl(
                              video.video_url,
                              video.progress_seconds,
                            )
                          : video.video_url;
                        window.open(target, "_blank", "noopener,noreferrer");
                      }}
                      title="Watch"
                      aria-label="Watch"
                      className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      <HiArrowTopRightOnSquare className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWatchlist.mutate(video.id)}
                      disabled={toggleWatchlist.isPending}
                      title="Remove from watchlist"
                      aria-label="Remove from watchlist"
                      className="inline-flex items-center justify-center rounded-md border border-secondary-300 bg-white p-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function TwitchSection({ streams }: { streams: TwitchLiveStream[] }) {
  if (streams.length === 0) {
    return (
      <div className="py-8 text-center text-secondary-500 dark:text-secondary-400">
        <HiVideoCamera className="mx-auto mb-3 h-12 w-12 text-secondary-400" />
        <p>No streams are currently live</p>
        <p className="mt-1 text-sm text-secondary-400">Check back later!</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {streams.map((stream) => (
        <div
          key={stream.id}
          className="rounded-lg border border-secondary-200 bg-white p-3 transition-shadow duration-200 hover:shadow-md dark:border-secondary-600 dark:bg-secondary-700 sm:p-4"
        >
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <a
                href={stream.channel_url}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0"
                aria-label={`Open ${stream.channel_name} on Twitch`}
              >
                {stream.channel_profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stream.channel_profile_image_url}
                    alt={stream.channel_name}
                    className="h-12 w-12 rounded-full border border-secondary-200 object-cover dark:border-secondary-600 sm:h-14 sm:w-14"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 sm:h-14 sm:w-14">
                    <HiVideoCamera className="h-6 w-6" />
                  </div>
                )}
              </a>
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 break-words text-base font-semibold text-secondary-900 dark:text-secondary-100">
                  {stream.title}
                </h4>
                <div className="mb-2 flex flex-col text-sm text-secondary-600 dark:text-secondary-400 sm:flex-row sm:items-center">
                  <div className="flex items-center">
                    <a
                      href={stream.channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-purple-600 hover:underline dark:text-purple-400"
                    >
                      {stream.channel_name}
                    </a>
                    {stream.game_name && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{stream.game_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col text-xs text-secondary-500 dark:text-secondary-400 sm:flex-row sm:space-x-4">
                  <div className="flex items-center">
                    <HiEye className="mr-1 h-4 w-4" />
                    {formatViewerCount(stream.viewer_count)} viewers
                  </div>
                  <div className="flex items-center">
                    <HiClock className="mr-1 h-4 w-4" />
                    Live for {stream.live_time}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex sm:ml-4">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    stream.channel_url,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40"
              >
                <HiArrowTopRightOnSquare className="h-4 w-4" />
                Watch
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RssSection({ unread }: { unread: RssNewsItem[] }) {
  return (
    <ul className="flex flex-col divide-y divide-secondary-200 rounded-md border border-secondary-200 dark:divide-secondary-800 dark:border-secondary-800">
      {unread.slice(0, 30).map((item) => (
        <li key={item.id} className="px-3 py-2 text-sm">
          <a
            href={item.link ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            {item.title}
          </a>
          <p className="text-xs text-secondary-500">
            {item.rss_feed?.name ?? "—"}
            {item.published_at ? ` · ${item.published_at}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ── Public BottomStrip ─────────────────────────────────────────────────────

export function CalendarBottomStrip({
  privileges,
  selectedDate,
}: {
  privileges: string[];
  selectedDate: string;
}) {
  const hasCashflow = privileges.includes("cashflow_track");
  const hasYoutube = privileges.includes("youtube_track");
  const hasTwitch = privileges.includes("twitch_track");
  const hasRss = privileges.includes("rss_news");

  // All API calls fire on mount (privilege-gated).
  const budgets = useCalendarBudgets(selectedDate, { enabled: hasCashflow });
  const wishlist = useWishlist();
  const media = useMedia();
  const planningUnlinked = usePlanningUnlinked();
  const youtube = useYoutubeWatchlist({ enabled: hasYoutube });
  const twitch = useTwitchLive({ enabled: hasTwitch });
  const rss = useRssNews({ enabled: hasRss });
  const anchors = useCalendarAnchors();

  const wishlistDue = useMemo(() => {
    const today = todayString();
    return (wishlist.data ?? [])
      .filter(
        (w) =>
          !w.is_purchased &&
          w.planned_purchase_date != null &&
          w.planned_purchase_date <= today,
      )
      .sort((a, b) =>
        (a.planned_purchase_date ?? "").localeCompare(
          b.planned_purchase_date ?? "",
        ),
      );
  }, [wishlist.data]);
  const watchlistMedia = useMemo(
    () => media.data?.watchlist ?? [],
    [media.data],
  );
  const planningTasks = planningUnlinked.data?.tasks ?? [];
  const youtubeVideos = youtube.data?.videos ?? [];
  const twitchStreams = twitch.data?.streams ?? [];
  const unreadRss = useMemo(
    () => (rss.data?.items ?? []).filter((i) => !i.is_read),
    [rss.data],
  );

  const budgetRows = budgets.data?.budgets ?? [];
  const anchoredEntities = anchors.data ?? [];

  const counts: Record<SectionKey, number> = {
    budget: budgetRows.length,
    entities: anchoredEntities.length,
    wishlist: wishlistDue.length,
    media: watchlistMedia.length,
    planning: planningTasks.length,
    youtube: youtubeVideos.length,
    twitch: twitchStreams.length,
    rss: unreadRss.length,
  };

  const visibleSections = useMemo(
    () =>
      ALL_SECTIONS.filter(
        (s) =>
          (!s.privilege || privileges.includes(s.privilege)) &&
          counts[s.key] > 0,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      privileges,
      counts.budget,
      counts.entities,
      counts.wishlist,
      counts.media,
      counts.planning,
      counts.youtube,
      counts.twitch,
      counts.rss,
    ],
  );

  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<SectionKey | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [expanded]);

  const currentKey: SectionKey | null =
    active && visibleSections.some((s) => s.key === active)
      ? active
      : (visibleSections[0]?.key ?? null);

  if (visibleSections.length === 0) return null;

  function renderSection(key: SectionKey) {
    switch (key) {
      case "budget":
        return <BudgetSection budgets={budgetRows} />;
      case "entities":
        return <EntitiesSection items={anchoredEntities} />;
      case "wishlist":
        return <WishlistSection items={wishlistDue} />;
      case "media":
        return <MediaSection items={watchlistMedia} />;
      case "planning":
        return <PlanningSection tasks={planningTasks} />;
      case "youtube":
        return <YouTubeSection videos={youtubeVideos} />;
      case "twitch":
        return <TwitchSection streams={twitchStreams} />;
      case "rss":
        return <RssSection unread={unreadRss} />;
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 border-t border-secondary-200 bg-white relative z-20 dark:border-secondary-700 dark:bg-secondary-800"
    >
      {expanded && (
        <div className="absolute bottom-full left-0 right-0 h-[50vh] flex flex-col bg-white border-t-2 border-primary-500 shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.25)] rounded-t-2xl overflow-hidden dark:bg-secondary-800 dark:border-primary-400 dark:shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.6)]">
          <div
            role="tablist"
            className="flex overflow-x-auto border-b border-secondary-200 dark:border-secondary-700"
          >
            {visibleSections.map((s) => {
              const isActive = s.key === currentKey;
              const Icon = s.icon;
              const c = counts[s.key];
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(s.key)}
                  className={[
                    "flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary-600 text-primary-700 bg-primary-50/60 dark:text-primary-300 dark:bg-primary-900/20"
                      : "border-transparent text-secondary-600 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:bg-secondary-700/50",
                  ].join(" ")}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{s.label}</span>
                  <span
                    className={[
                      "ml-0.5 px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-[1.25rem] text-center",
                      isActive
                        ? "bg-primary-600 text-white dark:bg-primary-500"
                        : "bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300",
                    ].join(" ")}
                  >
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {currentKey && renderSection(currentKey)}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-700/50"
      >
        <span>Additional task</span>
        <HiChevronDown
          className={[
            "w-5 h-5 transition-transform",
            expanded ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
