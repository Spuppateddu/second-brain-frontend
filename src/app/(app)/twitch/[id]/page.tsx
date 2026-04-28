"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { HiArrowLeft, HiPlayCircle, HiUsers } from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
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
      <main className="p-6">
        <p className="text-sm text-danger">Invalid channel id.</p>
      </main>
    );
  }

  if (isLoading || error || !data) {
    return (
      <EntityListShell
        title="Twitch Channel"
        isLoading={isLoading}
        error={error}
      >
        <p className="text-sm text-zinc-500">Loading…</p>
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
    <div className="mx-auto w-full max-w-3xl space-y-6 px-3 py-6 sm:px-6 sm:py-12">
      <div>
        <Link
          href="/twitch"
          className="inline-flex items-center text-sm text-zinc-500 hover:underline"
        >
          <HiArrowLeft className="mr-1 h-4 w-4" />
          Back to Twitch Channels
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-4 p-6">
          <ChannelHeader channel={channel} currentStream={currentStream} />

          {channel.description ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {channel.description}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-2">
            <InfoRow
              label="Status"
              value={channel.is_active ? "Active" : "Inactive"}
            />
            <InfoRow
              label="Push notifications"
              value={channel.push_notifications_enabled ? "Enabled" : "Disabled"}
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

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <a href={channel.url} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                variant="primary"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Open on Twitch
              </Button>
            </a>
            <Link href={`/twitch/${channel.id}/edit`}>
              <Button size="sm" variant="secondary">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="danger"
              isDisabled={remove.isPending}
              onClick={onDelete}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent streams</h2>
        {recentStreams.length === 0 ? (
          <p className="text-sm text-zinc-500">
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
        <div className="flex items-center gap-2">
          <h1 className="truncate text-xl font-semibold">{channel.name}</h1>
          {currentStream ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              LIVE
            </span>
          ) : null}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          @{channel.username}
        </p>
        {currentStream ? (
          <div className="mt-2 text-sm">
            {currentStream.title ? (
              <p className="font-medium">{currentStream.title}</p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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
    <li className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {stream.is_live ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                LIVE
              </span>
            ) : null}
            <p className="truncate text-sm font-medium">
              {stream.title ?? "Untitled stream"}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}:
      </span>
      <span className="text-zinc-600 dark:text-zinc-400">{value}</span>
    </div>
  );
}
