"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowLeft,
  HiArrowTopRightOnSquare,
  HiBookmark,
  HiBookmarkSlash,
  HiEye,
  HiEyeSlash,
  HiMagnifyingGlass,
  HiPlay,
} from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { Input } from "@/components/UI/Input";
import {
  useDeleteYoutubeChannel,
  useDownloadYoutubeChannelLatest,
  useToggleYoutubeChannelActive,
  useToggleYoutubeChannelVisibility,
  useToggleYoutubeVideoWatched,
  useToggleYoutubeVideoWatchlist,
  useYoutubeChannel,
} from "@/lib/queries/heavy";
import type {
  YoutubeChannelDetail,
  YoutubeChannelVideo,
} from "@/types/heavy";

export default function YoutubeChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const channelId = Number(id);
  const isValidId = !Number.isNaN(channelId);

  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useYoutubeChannel(
    isValidId ? channelId : null,
  );
  const toggleActive = useToggleYoutubeChannelActive();
  const toggleVisibility = useToggleYoutubeChannelVisibility();
  const downloadLatest = useDownloadYoutubeChannelLatest();
  const remove = useDeleteYoutubeChannel();

  const allVideos = data?.videos.data ?? [];
  const videos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allVideos;
    return allVideos.filter((video) =>
      video.title.toLowerCase().includes(term),
    );
  }, [allVideos, search]);

  if (!isValidId) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid channel id.</p>
      </main>
    );
  }

  if (isLoading || error || !data) {
    return (
      <EntityListShell
        title="YouTube Channel"
        isLoading={isLoading}
        error={error}
      >
        <p className="text-sm text-zinc-500">Loading…</p>
      </EntityListShell>
    );
  }

  const { channel } = data;

  const onDelete = async () => {
    if (!confirm(`Remove "${channel.name}" from your channels?`)) return;
    await remove.mutateAsync(channel.id);
    router.push("/youtube");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-3 py-6 sm:px-6 sm:py-12">
      <div>
        <Link
          href="/youtube"
          className="inline-flex items-center text-sm text-zinc-500 hover:underline"
        >
          <HiArrowLeft className="mr-1 h-4 w-4" />
          Back to YouTube
        </Link>
      </div>

      <ChannelCard
        channel={channel}
        videosCount={data.videos.total}
        onToggleActive={() => toggleActive.mutate(channel.id)}
        toggleActivePending={toggleActive.isPending}
        onToggleVisibility={() => toggleVisibility.mutate(channel.id)}
        toggleVisibilityPending={toggleVisibility.isPending}
        onDownloadLatest={() => downloadLatest.mutate(channel.id)}
        downloadPending={downloadLatest.isPending}
        onDelete={onDelete}
        deletePending={remove.isPending}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Videos ({data.videos.total})
          </h2>
        </div>

        {allVideos.length > 0 ? (
          <Input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
            fullWidth
          />
        ) : null}

        {allVideos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">
              No videos for this channel yet.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Try syncing the latest videos from RSS.
            </p>
          </div>
        ) : videos.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No videos match &ldquo;{search}&rdquo;.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {videos.map((video) => (
              <VideoRow key={video.id} video={video} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ChannelCard({
  channel,
  videosCount,
  onToggleActive,
  toggleActivePending,
  onToggleVisibility,
  toggleVisibilityPending,
  onDownloadLatest,
  downloadPending,
  onDelete,
  deletePending,
}: {
  channel: YoutubeChannelDetail;
  videosCount: number;
  onToggleActive: () => void;
  toggleActivePending: boolean;
  onToggleVisibility: () => void;
  toggleVisibilityPending: boolean;
  onDownloadLatest: () => void;
  downloadPending: boolean;
  onDelete: () => void;
  deletePending: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          {channel.thumbnail_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={channel.thumbnail_url}
              alt={channel.name}
              className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-900/30 sm:h-20 sm:w-20">
              📺
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold">
                {channel.name}
              </h1>
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
            {channel.description ? (
              <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                {channel.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-2">
          <InfoRow label="Videos" value={String(videosCount)} />
          <InfoRow
            label="Hidden from videos page"
            value={channel.hide_from_videos_page ? "Yes" : "No"}
          />
          <InfoRow
            label="Push notifications"
            value={channel.push_notifications_enabled ? "Enabled" : "Disabled"}
          />
          <InfoRow
            label="Last sync"
            value={
              channel.last_sync_at
                ? new Date(channel.last_sync_at).toLocaleString("it-IT")
                : "Never"
            }
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <a href={channel.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="primary">
              <HiArrowTopRightOnSquare className="mr-1 h-4 w-4" />
              Open on YouTube
            </Button>
          </a>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={downloadPending}
            onClick={onDownloadLatest}
          >
            <HiArrowDownTray className="mr-1 h-4 w-4" />
            {downloadPending ? "Syncing…" : "Sync latest"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={toggleVisibilityPending}
            onClick={onToggleVisibility}
          >
            {channel.hide_from_videos_page
              ? "Show on videos page"
              : "Hide from videos page"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={toggleActivePending}
            onClick={onToggleActive}
          >
            {channel.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Link href={`/youtube/${channel.id}/edit`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            isDisabled={deletePending}
            onClick={onDelete}
          >
            {deletePending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VideoRow({ video }: { video: YoutubeChannelVideo }) {
  const toggleWatched = useToggleYoutubeVideoWatched();
  const toggleWatchlist = useToggleYoutubeVideoWatchlist();
  const openVideo = () => window.open(video.video_url, "_blank");

  return (
    <li
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
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {video.human_duration ?? ""}
              {video.human_duration ? " • " : ""}
              {video.published_time}
            </p>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
            <ActionButtons
              video={video}
              onToggleWatchlist={() => toggleWatchlist.mutate(video.id)}
              onToggleWatched={() => toggleWatched.mutate(video.id)}
              onPlay={openVideo}
              watchlistPending={toggleWatchlist.isPending}
              watchedPending={toggleWatched.isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:hidden">
          <ActionButtons
            video={video}
            onToggleWatchlist={() => toggleWatchlist.mutate(video.id)}
            onToggleWatched={() => toggleWatched.mutate(video.id)}
            onPlay={openVideo}
            watchlistPending={toggleWatchlist.isPending}
            watchedPending={toggleWatched.isPending}
            mobile
          />
        </div>
      </div>
    </li>
  );
}

function ActionButtons({
  video,
  onToggleWatchlist,
  onToggleWatched,
  onPlay,
  watchlistPending,
  watchedPending,
  mobile,
}: {
  video: YoutubeChannelVideo;
  onToggleWatchlist: () => void;
  onToggleWatched: () => void;
  onPlay: () => void;
  watchlistPending: boolean;
  watchedPending: boolean;
  mobile?: boolean;
}) {
  const sizeClass = mobile ? "w-full" : "";
  return (
    <>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}:
      </span>
      <span className="text-zinc-600 dark:text-zinc-400">{value}</span>
    </div>
  );
}
