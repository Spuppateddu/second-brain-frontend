"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  HiArrowLongLeft,
  HiArrowTopRightOnSquare,
  HiPencilSquare,
  HiPlayCircle,
  HiTrash,
  HiUsers,
} from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import {
  useDeleteTwitchChannel,
  useTwitchChannel,
} from "@/lib/queries/heavy";
import type { TwitchChannelView, TwitchStreamView } from "@/types/heavy";

export default function TwitchChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const channelId = Number(id);
  const isValidId = !Number.isNaN(channelId);

  const router = useRouter();
  const { data, isLoading, error } = useTwitchChannel(
    isValidId ? channelId : null,
  );
  const remove = useDeleteTwitchChannel();

  if (!isValidId) {
    return (
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="mx-auto max-w-3xl text-sm text-danger-600 dark:text-danger-400">
          Invalid channel id.
        </p>
      </main>
    );
  }

  if (isLoading || error || !data) {
    return (
      <EntityListShell
        title="Twitch channel"
        isLoading={isLoading}
        error={error}
      >
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          Loading…
        </p>
      </EntityListShell>
    );
  }

  const { channel, recentStreams, currentStream } = data;

  const onDelete = async () => {
    if (!confirm(`Delete channel @${channel.username}?`)) return;
    await remove.mutateAsync(channel.id);
    router.push("/twitch");
  };

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header>
          <Link href="/twitch">
            <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
              Back to Twitch channels
            </Button>
          </Link>
        </header>

        <FormSection title="Channel">
          <ChannelHeader channel={channel} currentStream={currentStream} />

          {channel.description ? (
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {channel.description}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 border-t border-secondary-200 pt-4 text-sm dark:border-secondary-800 sm:grid-cols-2">
            <InfoRow
              label="Status"
              value={channel.is_active ? "Active" : "Inactive"}
            />
            <InfoRow
              label="Push notifications"
              value={
                channel.push_notifications_enabled ? "Enabled" : "Disabled"
              }
            />
            <InfoRow
              label="Last live"
              value={
                channel.last_live_at
                  ? new Date(channel.last_live_at).toLocaleString()
                  : "Mai"
              }
            />
            <InfoRow
              label="Last checked"
              value={
                channel.last_checked_at
                  ? new Date(channel.last_checked_at).toLocaleString()
                  : "Never"
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-secondary-200 pt-4 dark:border-secondary-800">
            <a href={channel.url} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<HiArrowTopRightOnSquare className="h-4 w-4" />}
              >
                Open on Twitch
              </Button>
            </a>
            <Link href={`/twitch/${channel.id}/edit`}>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<HiPencilSquare className="h-4 w-4" />}
              >
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="danger"
              disabled={remove.isPending}
              loading={remove.isPending}
              onClick={onDelete}
              leftIcon={<HiTrash className="h-4 w-4" />}
            >
              Delete
            </Button>
          </div>
        </FormSection>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Recent streams
          </h2>
          {recentStreams.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              No streams recorded yet for this channel.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentStreams.map((stream) => (
                <StreamRow key={stream.id} stream={stream} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function ChannelHeader({
  channel,
  currentStream,
}: {
  channel: TwitchChannelView;
  currentStream: TwitchStreamView | null;
}) {
  return (
    <div className="flex items-start gap-4">
      {channel.profile_image_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={channel.profile_image_url}
          alt={channel.name}
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-500">
          <span className="text-xl font-medium text-white">
            {channel.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {channel.name}
          </h1>
          {currentStream ? (
            <Badge variant="danger">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-danger-500" />
              LIVE
            </Badge>
          ) : null}
          <Badge variant={channel.is_active ? "success" : "neutral"}>
            {channel.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          @{channel.username}
        </p>
        {currentStream ? (
          <div className="mt-2 text-sm">
            {currentStream.title ? (
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                {currentStream.title}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-500 dark:text-secondary-400">
              {currentStream.game_name ? (
                <span className="inline-flex items-center gap-1">
                  <HiPlayCircle className="h-4 w-4" />
                  {currentStream.game_name}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <HiUsers className="h-4 w-4" />
                {currentStream.viewer_count.toLocaleString()} viewers
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StreamRow({ stream }: { stream: TwitchStreamView }) {
  const started = new Date(stream.started_at);
  const ended = stream.ended_at ? new Date(stream.ended_at) : null;
  const durationMs = ended ? ended.getTime() - started.getTime() : null;
  const durationLabel = durationMs ? formatDuration(durationMs) : null;

  return (
    <li className="rounded-[var(--radius-control)] border border-secondary-200 bg-white p-3 transition-colors hover:border-secondary-300 dark:border-secondary-800 dark:bg-secondary-950 dark:hover:border-secondary-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {stream.is_live ? <Badge variant="danger">LIVE</Badge> : null}
            <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {stream.title ?? "Untitled stream"}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-500 dark:text-secondary-400">
            {stream.game_name ? <span>{stream.game_name}</span> : null}
            <span>{started.toLocaleString()}</span>
            {durationLabel ? <span>· {durationLabel}</span> : null}
            <span className="inline-flex items-center gap-1">
              <HiUsers className="h-3.5 w-3.5" />
              {stream.viewer_count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-secondary-700 dark:text-secondary-300">
        {label}:
      </span>
      <span className="text-secondary-600 dark:text-secondary-400">
        {value}
      </span>
    </div>
  );
}
