"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiBookmark,
  HiBookmarkSlash,
  HiChevronLeft,
  HiChevronRight,
  HiEye,
  HiEyeSlash,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiPlay,
  HiPlayCircle,
  HiPlus,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import {
  useDeleteYoutubeChannel,
  useToggleYoutubeChannelActive,
  useToggleYoutubeChannelVisibility,
  useToggleYoutubeVideoWatched,
  useToggleYoutubeVideoWatchlist,
  useYoutubeChannels,
  useYoutubeVideosForDate,
} from "@/lib/queries/heavy";
import type { YoutubeChannelView, YoutubeDateVideo } from "@/types/heavy";

type Tab = "channels" | "videos";

function todayIso() {
  const now = new Date();
  const tz = now.getTimezoneOffset();
  return new Date(now.getTime() - tz * 60000).toISOString().split("T")[0];
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function YoutubePage() {
  const [tab, setTab] = useState<Tab>("channels");

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            YouTube
          </h1>
          {tab === "channels" ? (
            <Link href="/youtube/new" aria-label="Add new channel">
              <IconButton variant="primary" size="sm" label="Add new channel">
                <HiPlus />
              </IconButton>
            </Link>
          ) : null}
        </header>

        <div className="border-b border-secondary-200 dark:border-secondary-800">
          <nav className="-mb-px flex gap-4" aria-label="Tabs">
            <TabButton
              active={tab === "channels"}
              onClick={() => setTab("channels")}
            >
              Channels
            </TabButton>
            <TabButton
              active={tab === "videos"}
              onClick={() => setTab("videos")}
            >
              Videos
            </TabButton>
          </nav>
        </div>

        {tab === "channels" ? <ChannelsTab /> : <VideosTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
        active
          ? "border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300"
          : "border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ChannelsTab() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useYoutubeChannels({ search: debouncedSearch });
  const channels = data?.pages.flatMap((p) => p.channels.data) ?? [];
  const totalChannelsCount = data?.pages[0]?.totalChannelsCount ?? 0;

  return (
    <EntityListShell
      title=""
      isLoading={isLoading && totalChannelsCount === 0}
      error={error}
    >
      <div className="flex flex-col gap-4">
        {totalChannelsCount > 0 ? (
          <Input
            type="text"
            placeholder="Search channels…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
            fullWidth
          />
        ) : null}

        {totalChannelsCount === 0 && !isLoading ? (
          <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-12 text-center shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
            <p className="mb-2 text-base text-secondary-700 dark:text-secondary-200">
              No YouTube channels configured yet.
            </p>
            <p className="mb-6 text-sm text-secondary-500 dark:text-secondary-400">
              Add your favorite YouTube channels to track their latest videos
              automatically.
            </p>
            <Link href="/youtube/new" aria-label="Add your first channel">
              <IconButton
                variant="primary"
                size="lg"
                label="Add your first channel"
              >
                <HiPlus />
              </IconButton>
            </Link>
          </div>
        ) : channels.length === 0 && !isLoading ? (
          <div className="py-12 text-center">
            <HiMagnifyingGlass className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-700 dark:text-secondary-200">
              No channels found
            </h3>
            {debouncedSearch ? (
              <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                No channels match &ldquo;{debouncedSearch}&rdquo;. Try adjusting
                your search terms.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {channels.map((channel) => (
                <ChannelRow key={channel.id} channel={channel} />
              ))}
            </div>
            {hasNextPage ? (
              <Button
                variant="secondary"
                fullWidth
                disabled={isFetchingNextPage}
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Load more
              </Button>
            ) : null}
          </>
        )}
      </div>
    </EntityListShell>
  );
}

function ChannelRow({ channel }: { channel: YoutubeChannelView }) {
  const toggleActive = useToggleYoutubeChannelActive();
  const deleteChannel = useDeleteYoutubeChannel();

  const onDelete = () => {
    if (!confirm("Are you sure you want to delete this YouTube channel?")) {
      return;
    }
    deleteChannel.mutate(channel.id);
  };

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-secondary-200 border-l-4 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700 sm:flex-row sm:items-start sm:gap-4",
        channel.is_active
          ? "border-l-danger-500"
          : "border-l-secondary-300 dark:border-l-secondary-700",
      ].join(" ")}
    >
      {channel.thumbnail_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={channel.thumbnail_url}
          alt={channel.name}
          className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-danger-100 text-2xl dark:bg-danger-900/30 sm:h-20 sm:w-20 sm:text-3xl">
          📺
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start gap-2">
          <h3 className="truncate text-base font-semibold text-secondary-900 dark:text-secondary-100 sm:text-lg">
            {channel.name}
          </h3>
          <div className="flex shrink-0 gap-1">
            <Badge variant="danger">YouTube</Badge>
            <Badge variant={channel.is_active ? "success" : "neutral"}>
              {channel.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {channel.description ? (
          <p className="mb-2 line-clamp-2 text-sm text-secondary-600 dark:text-secondary-400">
            {channel.description}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary-500 dark:text-secondary-400">
          <span className="whitespace-nowrap">
            📹 {channel.videos_count} video
          </span>
          <span className="whitespace-nowrap">
            👁️ {channel.unwatched_videos_count} non visti
          </span>
          {channel.last_sync_at ? (
            <span className="whitespace-nowrap">
              🔄{" "}
              {new Date(channel.last_sync_at).toLocaleDateString("it-IT")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:items-center">
        <Link href={`/youtube/${channel.id}`} aria-label="Open">
          <IconButton size="sm" variant="secondary" label="Open">
            <HiPencilSquare />
          </IconButton>
        </Link>
        <IconButton
          size="sm"
          variant="secondary"
          label={channel.is_active ? "Deactivate" : "Activate"}
          disabled={toggleActive.isPending}
          onClick={() => toggleActive.mutate(channel.id)}
        >
          {channel.is_active ? <HiEyeSlash /> : <HiEye />}
        </IconButton>
        <IconButton
          size="sm"
          variant="danger"
          label="Delete"
          disabled={deleteChannel.isPending}
          onClick={onDelete}
        >
          <HiTrash />
        </IconButton>
      </div>
    </div>
  );
}

function VideosTab() {
  const [date, setDate] = useState<string>(() => todayIso());
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useYoutubeVideosForDate(date);
  const videos = data?.videos;

  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    const term = search.trim().toLowerCase();
    const sorted = [...videos].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    if (!term) return sorted;
    return sorted.filter((video) => {
      return (
        video.title.toLowerCase().includes(term) ||
        video.youtube_channel.name.toLowerCase().includes(term)
      );
    });
  }, [videos, search]);

  const hasVideos = (videos?.length ?? 0) > 0;

  const changeDate = (direction: "prev" | "next") => {
    const current = new Date(date);
    current.setDate(current.getDate() + (direction === "next" ? 1 : -1));
    setDate(current.toISOString().split("T")[0]);
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
        <IconButton
          size="sm"
          variant="ghost"
          label="Previous"
          onClick={() => changeDate("prev")}
        >
          <HiChevronLeft />
        </IconButton>

        <div className="min-w-0 flex-1 text-center">
          <h3 className="truncate px-1 text-sm font-semibold text-secondary-900 dark:text-secondary-100 sm:text-lg">
            <span className="sm:hidden">{formatShortDate(date)}</span>
            <span className="hidden sm:inline">{formatLongDate(date)}</span>
          </h3>
        </div>

        <IconButton
          size="sm"
          variant="ghost"
          label="Next"
          onClick={() => changeDate("next")}
        >
          <HiChevronRight />
        </IconButton>
      </div>

      <div className="mb-4 sm:mb-6">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos or channels…"
          leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
          fullWidth
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-secondary-500 dark:text-secondary-400">
          Loading…
        </p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-danger-600 dark:text-danger-400">
          Couldn&rsquo;t load the videos. Try refreshing.
        </p>
      ) : !hasVideos ? (
        <p className="py-8 text-center text-secondary-500 dark:text-secondary-400">
          No videos found for {formatLongDate(date)}
        </p>
      ) : filteredVideos.length === 0 ? (
        <p className="py-8 text-center text-secondary-500 dark:text-secondary-400">
          No videos found for &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {filteredVideos.map((video) => (
            <VideoRow key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoRow({ video }: { video: YoutubeDateVideo }) {
  const toggleWatched = useToggleYoutubeVideoWatched();
  const toggleWatchlist = useToggleYoutubeVideoWatchlist();
  const toggleVisibility = useToggleYoutubeChannelVisibility();

  const openVideo = () => window.open(video.video_url, "_blank");

  const hideChannel = () => {
    if (
      !confirm(
        `Hide all videos from "${video.youtube_channel.name}" from this page?\n\nThe channel will still sync new videos, but they won't appear here. You can view them on the channel's page.`,
      )
    ) {
      return;
    }
    toggleVisibility.mutate(video.youtube_channel.id);
  };

  return (
    <div
      className={[
        "rounded-[var(--radius-control)] border p-3 transition-colors",
        video.is_watched
          ? "border-secondary-200 bg-secondary-50 dark:border-secondary-800 dark:bg-secondary-900"
          : "border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-950",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 gap-3">
          <div className="shrink-0">
            {video.thumbnail_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="h-20 w-28 cursor-pointer rounded object-cover sm:h-24 sm:w-32"
                onClick={openVideo}
              />
            ) : (
              <div
                className="flex h-20 w-28 cursor-pointer items-center justify-center rounded bg-secondary-200 dark:bg-secondary-800 sm:h-24 sm:w-32"
                onClick={openVideo}
              >
                <HiPlay className="h-8 w-8 text-secondary-400" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={[
                "mb-1 line-clamp-2 text-sm font-semibold sm:text-base",
                video.is_watched
                  ? "text-secondary-600 dark:text-secondary-400"
                  : "text-secondary-900 dark:text-secondary-100",
              ].join(" ")}
            >
              {video.title}
            </h4>
            <p className="mb-1 truncate text-xs text-secondary-600 dark:text-secondary-400 sm:text-sm">
              {video.youtube_channel.name}
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-500">
              {video.human_duration ?? ""} • {video.published_time}
            </p>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-1.5 sm:flex">
            <VideoActionButtons
              video={video}
              onHide={hideChannel}
              onToggleWatchlist={() => toggleWatchlist.mutate(video.id)}
              onToggleWatched={() => toggleWatched.mutate(video.id)}
              onPlay={openVideo}
              hidePending={toggleVisibility.isPending}
              watchlistPending={toggleWatchlist.isPending}
              watchedPending={toggleWatched.isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:hidden">
          <VideoActionButtons
            video={video}
            onHide={hideChannel}
            onToggleWatchlist={() => toggleWatchlist.mutate(video.id)}
            onToggleWatched={() => toggleWatched.mutate(video.id)}
            onPlay={openVideo}
            hidePending={toggleVisibility.isPending}
            watchlistPending={toggleWatchlist.isPending}
            watchedPending={toggleWatched.isPending}
            mobile
          />
        </div>
      </div>
    </div>
  );
}

function VideoActionButtons({
  video,
  onHide,
  onToggleWatchlist,
  onToggleWatched,
  onPlay,
  hidePending,
  watchlistPending,
  watchedPending,
  mobile,
}: {
  video: YoutubeDateVideo;
  onHide: () => void;
  onToggleWatchlist: () => void;
  onToggleWatched: () => void;
  onPlay: () => void;
  hidePending: boolean;
  watchlistPending: boolean;
  watchedPending: boolean;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <>
        <Button
          size="sm"
          variant="danger"
          fullWidth
          disabled={hidePending}
          onClick={onHide}
          leftIcon={<HiXMark className="h-4 w-4" />}
        >
          Hide
        </Button>
        <Button
          size="sm"
          variant={video.is_watchlist ? "primary" : "secondary"}
          fullWidth
          disabled={watchlistPending}
          onClick={onToggleWatchlist}
          leftIcon={
            video.is_watchlist ? (
              <HiBookmark className="h-4 w-4" />
            ) : (
              <HiBookmarkSlash className="h-4 w-4" />
            )
          }
        >
          {video.is_watchlist ? "Saved" : "Save"}
        </Button>
        <Button
          size="sm"
          variant={video.is_watched ? "secondary" : "info"}
          fullWidth
          disabled={watchedPending}
          onClick={onToggleWatched}
          leftIcon={
            video.is_watched ? (
              <HiEye className="h-4 w-4" />
            ) : (
              <HiEyeSlash className="h-4 w-4" />
            )
          }
        >
          {video.is_watched ? "Watched" : "Watch"}
        </Button>
        <Button
          size="sm"
          variant="danger"
          fullWidth
          onClick={onPlay}
          leftIcon={<HiPlay className="h-4 w-4" />}
        >
          Play
        </Button>
      </>
    );
  }

  return (
    <>
      <IconButton
        size="sm"
        variant="danger"
        label={`Hide videos from ${video.youtube_channel.name}`}
        disabled={hidePending}
        onClick={onHide}
      >
        <HiXMark />
      </IconButton>
      <IconButton
        size="sm"
        variant={video.is_watchlist ? "primary" : "secondary"}
        label={video.is_watchlist ? "Remove from watchlist" : "Add to watchlist"}
        disabled={watchlistPending}
        onClick={onToggleWatchlist}
      >
        {video.is_watchlist ? <HiBookmark /> : <HiBookmarkSlash />}
      </IconButton>
      <IconButton
        size="sm"
        variant={video.is_watched ? "secondary" : "info"}
        label={video.is_watched ? "Mark as unwatched" : "Mark as watched"}
        disabled={watchedPending}
        onClick={onToggleWatched}
      >
        {video.is_watched ? <HiEye /> : <HiEyeSlash />}
      </IconButton>
      <IconButton
        size="sm"
        variant="danger"
        label="Play video"
        onClick={onPlay}
      >
        <HiPlayCircle />
      </IconButton>
    </>
  );
}
