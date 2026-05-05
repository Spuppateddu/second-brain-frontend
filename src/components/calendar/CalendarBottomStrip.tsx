"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiArrowTopRightOnSquare,
  HiCheck,
  HiChevronDown,
  HiClipboardDocumentList,
  HiClock,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiEye,
  HiFilm,
  HiHome,
  HiLink,
  HiNewspaper,
  HiPlay,
  HiPlus,
  HiShoppingCart,
  HiTrash,
  HiVideoCamera,
} from "react-icons/hi2";
import type { IconType } from "react-icons";

import {
  useMedia,
  useToggleWishlistPurchased,
  useWishlist,
} from "@/lib/queries/entities";
import {
  useAddYoutubeByUrl,
  useCalendarBudgets,
  useCopyPlanningToCalendar,
  usePlanningUnlinked,
  useRssNews,
  useToggleYoutubeVideoWatchlist,
  useToggleYoutubeWatched,
  useTwitchLive,
  useUpdatePlanningTask,
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
    return <p className="text-sm text-zinc-500">No active budgets.</p>;
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
    ? "bg-danger"
    : over
      ? "bg-amber-500"
      : "bg-success-500";

  return (
    <li
      className={[
        "rounded-lg border p-3 text-sm",
        exceeded
          ? "border-danger/40 bg-danger/5"
          : over
            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{budget.name}</p>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {budget.type} · {budget.payments_count} payment
            {budget.payments_count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end">
          <span className={exceeded ? "font-semibold text-danger" : "font-semibold"}>
            {fmtMoney(budget.total_spent)} / {fmtMoney(budget.amount)}
          </span>
          <span
            className={[
              "text-xs",
              exceeded
                ? "text-danger"
                : over
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-zinc-500",
            ].join(" ")}
          >
            {exceeded
              ? `${fmtMoney(Math.abs(budget.amount_left))} over`
              : `${fmtMoney(budget.amount_left)} left`}{" "}
            · {budget.percentage}%
          </span>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={["h-full transition-all", barColor].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function WishlistSection({ items }: { items: WishlistItem[] }) {
  const togglePurchased = useToggleWishlistPurchased();

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
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
            className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{w.name}</p>
              <p className="text-xs text-zinc-500">
                {w.planned_purchase_date
                  ? formatLocaleDate(w.planned_purchase_date)
                  : "No planned date"}
                {price != null && !Number.isNaN(price)
                  ? ` · ${fmtMoney(price)}`
                  : ""}
              </p>
              {w.notes && (
                <p className="mt-1 truncate text-xs text-zinc-500">{w.notes}</p>
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
                  className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <HiArrowTopRightOnSquare className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => togglePurchased.mutate(w.id)}
                disabled={togglePurchased.isPending}
                className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
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
    return <p className="text-sm text-zinc-500">Watchlist is empty.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((m) => (
        <li
          key={m.id}
          className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow duration-200 hover:shadow-md dark:border-gray-600 dark:bg-gray-700"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4
                className={[
                  "truncate font-semibold",
                  m.is_done
                    ? "text-gray-500 line-through dark:text-gray-400"
                    : "text-gray-900 dark:text-gray-100",
                ].join(" ")}
              >
                {m.title}
              </h4>
              {m.description && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                  {m.description}
                </p>
              )}
            </div>
            {m.review_category && (
              <span
                className="flex-shrink-0 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
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
        </li>
      ))}
    </ul>
  );
}

function formatLocaleDate(date: string): string {
  const justDate = date.slice(0, 10);
  return new Date(`${justDate}T00:00:00`).toLocaleDateString("en-GB");
}

function planningTypeLabel(
  type: { slug?: string; name: string } | null | undefined,
): string {
  if (!type) return "";
  if (type.slug === "month") return "Monthly";
  if (type.slug === "year") return "Yearly";
  return type.name;
}

function PlanningSection({
  tasks,
  selectedDate,
}: {
  tasks: PlanningTaskUnlinked[];
  selectedDate: string;
}) {
  const copyToCalendar = useCopyPlanningToCalendar();
  const updateTask = useUpdatePlanningTask();
  const [busyId, setBusyId] = useState<number | null>(null);

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No unlinked planning tasks.</p>
    );
  }

  async function linkToCalendar(taskId: number) {
    setBusyId(taskId);
    try {
      await copyToCalendar.mutateAsync({ taskId, taskDate: selectedDate });
    } finally {
      setBusyId(null);
    }
  }

  async function markDone(taskId: number) {
    setBusyId(taskId);
    try {
      await updateTask.mutateAsync({ id: taskId, patch: { is_done: true } });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow duration-200 hover:shadow-md dark:border-gray-600 dark:bg-gray-700"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="flex-1 truncate font-semibold text-gray-900 dark:text-gray-100">
              {task.content}
            </h4>
            {task.stars ? (
              <span className="whitespace-nowrap text-xs font-bold text-yellow-500 dark:text-yellow-400">
                {"★".repeat(task.stars)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {planningTypeLabel(task.planning_type)}
              {task.start_date ? ` · ${formatLocaleDate(task.start_date)}` : ""}
            </p>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => linkToCalendar(task.id)}
                disabled={busyId === task.id}
                title={`Link to ${formatLocaleDate(selectedDate)}`}
                className="inline-flex items-center gap-1 rounded-md bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-200 disabled:opacity-50 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
              >
                <HiLink className="h-4 w-4" />
                <span className="hidden sm:inline">Link</span>
              </button>
              <button
                type="button"
                onClick={() => markDone(task.id)}
                disabled={busyId === task.id}
                title="Mark as done"
                className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              >
                <HiCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Done</span>
              </button>
            </div>
          </div>
        </div>
      ))}
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
    const parsed = trimmed === "" ? null : parseProgressInput(trimmed);
    if (trimmed !== "" && parsed === null) {
      setEditingId(null);
      return;
    }
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
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
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
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200/40 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <HiVideoCamera className="mx-auto mb-3 h-12 w-12 text-gray-400" />
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
                className="rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 sm:p-4"
              >
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0">
                  <div className="flex-shrink-0 self-start">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-gray-200 sm:h-16 sm:w-24">
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
                          ? "text-gray-600 dark:text-gray-400"
                          : "text-gray-900 dark:text-gray-100",
                      ].join(" ")}
                    >
                      {video.title}
                    </h4>
                    {(video.stars ?? 0) > 0 && (
                      <p className="mb-2 text-xs text-yellow-500 dark:text-yellow-400">
                        {"★".repeat(video.stars ?? 0)}
                      </p>
                    )}
                    <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:items-center">
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
                              className="ml-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
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
                                placeholder="mm:ss"
                                autoFocus
                                className="w-24 rounded border border-red-300 bg-white px-1.5 py-0.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-700 dark:bg-gray-800 dark:text-gray-100"
                              />
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
                      className={[
                        "inline-flex items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50",
                        video.is_watched
                          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                          : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
                      ].join(" ")}
                    >
                      <HiCheck className="h-4 w-4" />
                      <span className="truncate">
                        {video.is_watched ? "Watched" : "Mark Watched"}
                      </span>
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
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      <HiArrowTopRightOnSquare className="h-4 w-4" />
                      <span className="truncate">Watch</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWatchlist.mutate(video.id)}
                      disabled={toggleWatchlist.isPending}
                      title="Remove from watchlist"
                      aria-label="Remove from watchlist"
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <HiTrash className="h-4 w-4" />
                      <span className="truncate">Remove</span>
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
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        <HiVideoCamera className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <p>No streams are currently live</p>
        <p className="mt-1 text-sm text-gray-400">Check back later!</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {streams.map((stream) => (
        <div
          key={stream.id}
          className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow duration-200 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 sm:p-4"
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
                    className="h-12 w-12 rounded-full border border-gray-200 object-cover dark:border-gray-600 sm:h-14 sm:w-14"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 sm:h-14 sm:w-14">
                    <HiVideoCamera className="h-6 w-6" />
                  </div>
                )}
              </a>
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 break-words text-base font-semibold text-gray-900 dark:text-gray-100">
                  {stream.title}
                </h4>
                <div className="mb-2 flex flex-col text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:items-center">
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
                <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:space-x-4">
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
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
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
          <p className="text-xs text-zinc-500">
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

  const counts: Record<SectionKey, number> = {
    budget: budgetRows.length,
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
      case "wishlist":
        return <WishlistSection items={wishlistDue} />;
      case "media":
        return <MediaSection items={watchlistMedia} />;
      case "planning":
        return (
          <PlanningSection
            tasks={planningTasks}
            selectedDate={selectedDate}
          />
        );
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
      className="flex-shrink-0 border-t border-gray-200 bg-white relative z-20 dark:border-gray-700 dark:bg-gray-800"
    >
      {expanded && (
        <div className="absolute bottom-full left-0 right-0 h-[50vh] flex flex-col bg-white border-t-2 border-primary-500 shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.25)] rounded-t-2xl overflow-hidden dark:bg-gray-800 dark:border-primary-400 dark:shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.6)]">
          <div
            role="tablist"
            className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700"
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
                      : "border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50",
                  ].join(" ")}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{s.label}</span>
                  <span
                    className={[
                      "ml-0.5 px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-[1.25rem] text-center",
                      isActive
                        ? "bg-primary-600 text-white dark:bg-primary-500"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
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
        className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
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
