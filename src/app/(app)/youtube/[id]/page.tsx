"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowLongLeft,
  HiArrowTopRightOnSquare,
  HiBookmark,
  HiBookmarkSlash,
  HiEye,
  HiEyeSlash,
  HiInformationCircle,
  HiMagnifyingGlass,
  HiPlay,
  HiPlayCircle,
} from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import {
  useDeleteYoutubeChannel,
  useDownloadYoutubeChannelLatest,
  useToggleYoutubeVideoWatched,
  useToggleYoutubeVideoWatchlist,
  useUpdateYoutubeChannel,
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
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-2xl text-sm text-danger-600 dark:text-danger-400">
          Invalid channel id.
        </p>
      </main>
    );
  }

  if (isLoading || error || !data) {
    return (
      <EntityListShell
        title="YouTube channel"
        isLoading={isLoading}
        error={error}
      >
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          Loading…
        </p>
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <header>
          <Link href="/youtube">
            <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
              Back to YouTube
            </Button>
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Edit YouTube channel
          </h1>
        </header>

        <ChannelSettingsCard
          channel={channel}
          videosCount={data.videos.total}
          onDownloadLatest={() => downloadLatest.mutate(channel.id)}
          downloadPending={downloadLatest.isPending}
          onDelete={onDelete}
          deletePending={remove.isPending}
        />

        <div className="rounded-[var(--radius-card)] border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
          <div className="flex items-start gap-3">
            <HiInformationCircle className="h-5 w-5 shrink-0 text-info-500" />
            <div>
              <h3 className="text-sm font-medium text-info-800 dark:text-info-200">
                Editing YouTube channel
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-info-700 dark:text-info-300">
                <li>
                  Toggle <strong>Active</strong> to enable/disable video tracking
                </li>
                <li>
                  Toggle <strong>Hide from videos page</strong> to keep videos
                  syncing without appearing on the daily videos list
                </li>
                <li>All changes will be saved when you click Update channel</li>
              </ul>
            </div>
          </div>
        </div>

        <FormSection title={`Videos (${data.videos.total})`}>
          {allVideos.length > 0 ? (
            <Input
              type="text"
              placeholder="Search videos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
              fullWidth
            />
          ) : null}

          {allVideos.length === 0 ? (
            <div className="rounded-[var(--radius-control)] border border-dashed border-secondary-300 py-10 text-center dark:border-secondary-700">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No videos for this channel yet.
              </p>
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                Try syncing the latest videos from RSS.
              </p>
            </div>
          ) : videos.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary-500 dark:text-secondary-400">
              No videos match &ldquo;{search}&rdquo;.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {videos.map((video) => (
                <VideoRow key={video.id} video={video} />
              ))}
            </ul>
          )}
        </FormSection>
      </div>
    </div>
  );
}

function ChannelSettingsCard({
  channel,
  videosCount,
  onDownloadLatest,
  downloadPending,
  onDelete,
  deletePending,
}: {
  channel: YoutubeChannelDetail;
  videosCount: number;
  onDownloadLatest: () => void;
  downloadPending: boolean;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const router = useRouter();
  const update = useUpdateYoutubeChannel(channel.id);

  const [isActive, setIsActive] = useState(channel.is_active);
  const [hideFromVideos, setHideFromVideos] = useState(
    channel.hide_from_videos_page,
  );
  const [pushEnabled, setPushEnabled] = useState(
    channel.push_notifications_enabled,
  );
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    try {
      await update.mutateAsync({
        is_active: isActive,
        hide_from_videos_page: hideFromVideos,
        push_notifications_enabled: pushEnabled,
      });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setGeneralError(message);
    }
  }

  return (
    <FormSection title="Channel settings">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          {channel.thumbnail_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={channel.thumbnail_url}
              alt={channel.name}
              className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-danger-100 text-2xl dark:bg-danger-900/30 sm:h-20 sm:w-20">
              📺
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {channel.name}
              </h2>
              <Badge variant="danger">YouTube</Badge>
              <Badge variant={channel.is_active ? "success" : "neutral"}>
                {channel.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {channel.description ? (
              <p className="mt-2 line-clamp-3 text-sm text-secondary-600 dark:text-secondary-400">
                {channel.description}
              </p>
            ) : null}
          </div>
        </div>

        <Input
          id="channel-url"
          label="YouTube channel URL"
          type="url"
          value={channel.url}
          readOnly
          helperText="URL is managed by YouTube and cannot be changed"
          fullWidth
        />

        <div className="space-y-3">
          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
              />
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Active (automatically sync new videos from this channel)
              </span>
            </label>
            <p className="mt-1 pl-6 text-xs text-secondary-500 dark:text-secondary-400">
              Uncheck this to temporarily stop tracking this channel without
              deleting it
            </p>
          </div>

          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={hideFromVideos}
                onChange={(e) => setHideFromVideos(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
              />
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Hide from videos page
              </span>
            </label>
            <p className="mt-1 pl-6 text-xs text-secondary-500 dark:text-secondary-400">
              Videos will still sync but won&rsquo;t appear on the daily videos
              list
            </p>
          </div>

          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
              />
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Send push notification when this channel uploads a new video
              </span>
            </label>
            <p className="mt-1 pl-6 text-xs text-secondary-500 dark:text-secondary-400">
              Uncheck to stop receiving push notifications for this channel
              only
            </p>
          </div>
        </div>

        <div className="border-t border-secondary-200 pt-4 dark:border-secondary-800">
          <h3 className="mb-3 text-sm font-medium text-secondary-700 dark:text-secondary-200">
            Channel information
          </h3>
          <div className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
            <InfoRow label="Videos" value={String(videosCount)} />
            <InfoRow
              label="Last sync"
              value={
                channel.last_sync_at
                  ? new Date(channel.last_sync_at).toLocaleString("it-IT")
                  : "Never"
              }
            />
          </div>
        </div>

        {generalError ? (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            {generalError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-secondary-200 pt-4 dark:border-secondary-800">
          <a href={channel.url} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<HiArrowTopRightOnSquare className="h-4 w-4" />}
            >
              Open on YouTube
            </Button>
          </a>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={onDownloadLatest}
            disabled={downloadPending}
            loading={downloadPending}
            leftIcon={<HiArrowDownTray className="h-4 w-4" />}
          >
            Sync latest
          </Button>
          <Button
            size="sm"
            variant="danger"
            type="button"
            onClick={onDelete}
            disabled={deletePending}
            loading={deletePending}
          >
            Delete
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => router.push("/youtube")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={update.isPending}
            loading={update.isPending}
          >
            Update channel
          </Button>
        </div>
      </form>
    </FormSection>
  );
}

function VideoRow({ video }: { video: YoutubeChannelVideo }) {
  const toggleWatched = useToggleYoutubeVideoWatched();
  const toggleWatchlist = useToggleYoutubeVideoWatchlist();
  const openVideo = () => window.open(video.video_url, "_blank");

  return (
    <li
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
            <p className="text-xs text-secondary-500 dark:text-secondary-500">
              {video.human_duration ?? ""}
              {video.human_duration ? " • " : ""}
              {video.published_time}
            </p>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-1.5 sm:flex">
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
  if (mobile) {
    return (
      <>
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
          variant={video.is_watched ? "info" : "secondary"}
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
        variant={video.is_watchlist ? "primary" : "secondary"}
        label={video.is_watchlist ? "Remove from watchlist" : "Add to watchlist"}
        disabled={watchlistPending}
        onClick={onToggleWatchlist}
      >
        {video.is_watchlist ? <HiBookmark /> : <HiBookmarkSlash />}
      </IconButton>
      <IconButton
        size="sm"
        variant={video.is_watched ? "info" : "secondary"}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-secondary-700 dark:text-secondary-300">
        {label}:
      </span>
      <span className="text-secondary-600 dark:text-secondary-400">{value}</span>
    </div>
  );
}
