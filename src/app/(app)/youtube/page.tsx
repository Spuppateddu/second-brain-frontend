"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiBookmark,
  HiBookmarkSlash,
  HiChevronLeft,
  HiChevronRight,
  HiEye,
  HiEyeSlash,
  HiMagnifyingGlass,
  HiPlay,
  HiXMark,
} from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
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
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">YouTube</h1>
        {tab === "channels" ? (
          <Link href="/youtube/new">
            <Button variant="primary" size="sm">
              Add New Channel
            </Button>
          </Link>
        ) : null}
      </header>

      <div className="border-b border-zinc-200 dark:border-zinc-800">
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
      className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-danger-500 text-danger-600 dark:text-danger-400"
          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function ChannelsTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useYoutubeChannels({ search });
  const channels = data?.channels.data ?? [];
  const totalChannelsCount = data?.totalChannelsCount ?? 0;

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
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
            fullWidth
          />
        ) : null}

        {totalChannelsCount === 0 && !isLoading ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-lg text-zinc-500 dark:text-zinc-400">
              No YouTube channels configured yet.
            </p>
            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
              Add your favorite YouTube channels to track their latest videos
              automatically.
            </p>
            <Link href="/youtube/new">
              <Button variant="primary">Add Your First Channel</Button>
            </Link>
          </div>
        ) : channels.length === 0 && !isLoading ? (
          <div className="py-12 text-center">
            <HiMagnifyingGlass className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-2 text-sm font-medium">No channels found</h3>
            {search ? (
              <p className="mt-1 text-sm text-zinc-500">
                No channels match &ldquo;{search}&rdquo;. Try adjusting your
                search terms.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {channels.map((channel) => (
              <ChannelRow key={channel.id} channel={channel} />
            ))}
          </div>
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
      className={`flex flex-col gap-3 rounded-lg border-l-4 bg-white p-4 shadow-sm dark:bg-zinc-950 sm:flex-row sm:items-start sm:gap-4 ${
        channel.is_active
          ? "border-l-danger-500"
          : "border-l-zinc-300 dark:border-l-zinc-700"
      } border border-zinc-200 dark:border-zinc-800`}
    >
      {channel.thumbnail_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={channel.thumbnail_url}
          alt={channel.name}
          className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-900/30 sm:h-20 sm:w-20 sm:text-3xl">
          📺
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start gap-2">
          <h3 className="truncate text-base font-semibold sm:text-lg">
            {channel.name}
          </h3>
          <div className="flex shrink-0 gap-1">
            <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700 dark:bg-danger-900/40 dark:text-danger-300">
              YouTube
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                channel.is_active
                  ? "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {channel.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {channel.description ? (
          <p className="mb-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {channel.description}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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

      <div className="flex flex-wrap gap-2 sm:shrink-0 sm:items-center">
        <Link href={`/youtube/${channel.id}`}>
          <Button size="sm" variant="secondary">
            View Videos
          </Button>
        </Link>
        <Link href={`/youtube/${channel.id}/edit`}>
          <Button size="sm" variant="secondary">
            Edit
          </Button>
        </Link>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={toggleActive.isPending}
          onClick={() => toggleActive.mutate(channel.id)}
        >
          {channel.is_active ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="sm"
          variant="danger"
          isDisabled={deleteChannel.isPending}
          onClick={onDelete}
        >
          Delete
        </Button>
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
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => changeDate("prev")}
        >
          <HiChevronLeft className="h-5 w-5" />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </Button>

        <div className="min-w-0 flex-1 text-center">
          <h3 className="truncate px-1 text-sm font-semibold sm:text-lg">
            <span className="sm:hidden">{formatShortDate(date)}</span>
            <span className="hidden sm:inline">{formatLongDate(date)}</span>
          </h3>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => changeDate("next")}
        >
          <span className="mr-1 hidden sm:inline">Successivo</span>
          <HiChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-4 sm:mb-6">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos or channels..."
          leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
          fullWidth
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-danger">
          Couldn&rsquo;t load the videos. Try refreshing.
        </p>
      ) : !hasVideos ? (
        <p className="py-8 text-center text-zinc-500">
          No videos found for {formatLongDate(date)}
        </p>
      ) : filteredVideos.length === 0 ? (
        <p className="py-8 text-center text-zinc-500">
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
      className={`rounded-md border p-3 ${
        video.is_watched
          ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
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
                className="flex h-20 w-28 cursor-pointer items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 sm:h-24 sm:w-32"
                onClick={openVideo}
              >
                <HiPlay className="h-8 w-8 text-zinc-400" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`mb-1 line-clamp-2 text-sm font-semibold sm:text-base ${
                video.is_watched
                  ? "text-zinc-600 dark:text-zinc-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {video.title}
            </h4>
            <p className="mb-1 truncate text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
              {video.youtube_channel.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {video.human_duration ?? ""} • {video.published_time}
            </p>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
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
  const sizeClass = mobile ? "w-full" : "";
  return (
    <>
      <Button
        size="sm"
        variant="danger-soft"
        isIconOnly={!mobile}
        isDisabled={hidePending}
        onClick={onHide}
        className={sizeClass}
        aria-label={`Hide videos from ${video.youtube_channel.name}`}
      >
        <HiXMark className="h-5 w-5" />
      </Button>
      <Button
        size="sm"
        variant={video.is_watchlist ? "primary" : "outline"}
        isIconOnly={!mobile}
        isDisabled={watchlistPending}
        onClick={onToggleWatchlist}
        className={sizeClass}
        aria-label={
          video.is_watchlist ? "Remove from watchlist" : "Add to watchlist"
        }
      >
        {video.is_watchlist ? (
          <HiBookmark className="h-5 w-5" />
        ) : (
          <HiBookmarkSlash className="h-5 w-5" />
        )}
      </Button>
      <Button
        size="sm"
        variant={video.is_watched ? "secondary" : "outline"}
        isIconOnly={!mobile}
        isDisabled={watchedPending}
        onClick={onToggleWatched}
        className={sizeClass}
        aria-label={video.is_watched ? "Mark as unwatched" : "Mark as watched"}
      >
        {video.is_watched ? (
          <HiEye className="h-5 w-5" />
        ) : (
          <HiEyeSlash className="h-5 w-5" />
        )}
      </Button>
      <Button
        size="sm"
        variant="danger"
        isIconOnly={!mobile}
        onClick={onPlay}
        className={sizeClass}
        aria-label="Play video"
      >
        <HiPlay className="h-5 w-5" />
      </Button>
    </>
  );
}
