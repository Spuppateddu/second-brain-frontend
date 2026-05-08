"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiArrowTopRightOnSquare,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiPlayCircle,
  HiPlus,
  HiSquares2X2,
  HiUserGroup,
  HiVideoCamera,
} from "react-icons/hi2";

import { Badge } from "@/components/UI/Badge";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import { useTwitchChannels } from "@/lib/queries/heavy";
import type { TwitchChannelView } from "@/types/heavy";

export default function TwitchPage() {
  const { data, isLoading, error } = useTwitchChannels();
  const [searchTerm, setSearchTerm] = useState("");

  const channels = useMemo(() => data?.channels ?? [], [data?.channels]);
  const liveChannelsCount = data?.liveChannelsCount ?? 0;
  const activeChannelsCount = useMemo(
    () => channels.filter((c) => c.is_active).length,
    [channels],
  );

  const filteredChannels = useMemo(() => {
    if (!searchTerm.trim()) return channels;
    const term = searchTerm.toLowerCase();
    return channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(term) ||
        channel.username.toLowerCase().includes(term),
    );
  }, [channels, searchTerm]);

  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Twitch channels
          </h1>
          <Link href="/twitch/new" aria-label="Add new channel">
            <IconButton variant="primary" size="sm" label="Add new channel">
              <HiPlus />
            </IconButton>
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
          <StatCard
            icon={<HiUserGroup className="h-4 w-4 text-white sm:h-5 sm:w-5" />}
            iconBg="bg-purple-500"
            label="Total channels"
            value={channels.length}
          />
          <StatCard
            icon={<HiPlayCircle className="h-4 w-4 text-white sm:h-5 sm:w-5" />}
            iconBg="bg-danger-500"
            label="Live now"
            value={liveChannelsCount}
          />
          <StatCard
            icon={<HiSquares2X2 className="h-4 w-4 text-white sm:h-5 sm:w-5" />}
            iconBg="bg-info-500"
            label="Active channels"
            value={activeChannelsCount}
          />
        </div>

        <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <Input
              type="text"
              placeholder="Search channels…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
              fullWidth
            />
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-sm text-secondary-500 dark:text-secondary-400">
              Loading…
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm text-danger-600 dark:text-danger-400">
              Couldn&rsquo;t load the channels. Try refreshing.
            </p>
          ) : filteredChannels.length === 0 && searchTerm ? (
            <div className="py-8 text-center sm:py-12">
              <HiMagnifyingGlass className="mx-auto h-10 w-10 text-secondary-400 sm:h-12 sm:w-12" />
              <h3 className="mt-2 text-sm font-medium text-secondary-700 dark:text-secondary-200">
                No channels found
              </h3>
              <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                No channels match &ldquo;{searchTerm}&rdquo;.
              </p>
            </div>
          ) : channels.length === 0 ? (
            <div className="py-8 text-center sm:py-12">
              <HiVideoCamera className="mx-auto h-10 w-10 text-secondary-400 sm:h-12 sm:w-12" />
              <h3 className="mt-2 text-sm font-medium text-secondary-700 dark:text-secondary-200">
                No Twitch channels configured.
              </h3>
              <p className="mt-1 px-4 text-sm text-secondary-500 dark:text-secondary-400">
                Aggiungi i tuoi canali Twitch preferiti per seguire le loro
                live.
              </p>
              <div className="mt-6">
                <Link href="/twitch/new" aria-label="Add Twitch channel">
                  <IconButton
                    variant="primary"
                    size="lg"
                    label="Add Twitch channel"
                  >
                    <HiPlus />
                  </IconButton>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                  <thead className="bg-secondary-50 dark:bg-secondary-900">
                    <tr>
                      <Th>Channel</Th>
                      <Th>Stato</Th>
                      <Th>Ultima live</Th>
                      <Th>Azioni</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 bg-white dark:divide-secondary-800 dark:bg-secondary-950">
                    {filteredChannels.map((channel) => (
                      <ChannelRow key={channel.id} channel={channel} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 sm:hidden">
                {filteredChannels.map((channel) => (
                  <ChannelMobileCard key={channel.id} channel={channel} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-secondary-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
      <div className="flex items-center">
        <div className="shrink-0">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${iconBg}`}
          >
            {icon}
          </div>
        </div>
        <div className="ml-3 w-0 flex-1 sm:ml-5">
          <dt className="truncate text-xs font-medium text-secondary-500 dark:text-secondary-400 sm:text-sm">
            {label}
          </dt>
          <dd className="text-base font-medium text-secondary-900 dark:text-secondary-100 sm:text-lg">
            {value}
          </dd>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-300">
      {children}
    </th>
  );
}

function ChannelAvatar({ channel }: { channel: TwitchChannelView }) {
  if (channel.profile_image_url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={channel.profile_image_url}
        alt={channel.name}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500">
      <span className="text-sm font-medium text-white">
        {channel.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "success" : "neutral"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function formatLastLive(iso: string | null) {
  if (!iso) return "Mai";
  return new Date(iso).toLocaleDateString("it-IT");
}

function ChannelRow({ channel }: { channel: TwitchChannelView }) {
  return (
    <tr className="transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-900">
      <td className="whitespace-nowrap px-6 py-4">
        <Link
          href={`/twitch/${channel.id}`}
          className="flex items-center hover:underline"
        >
          <ChannelAvatar channel={channel} />
          <div className="ml-4">
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {channel.name}
            </div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400">
              @{channel.username}
            </div>
          </div>
        </Link>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <StatusBadge active={channel.is_active} />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-500 dark:text-secondary-400">
        {formatLastLive(channel.last_live_at)}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-1.5">
          <a
            href={channel.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open on Twitch"
          >
            <IconButton size="sm" variant="secondary" label="Open on Twitch">
              <HiArrowTopRightOnSquare />
            </IconButton>
          </a>
          <Link
            href={`/twitch/${channel.id}/edit`}
            aria-label="Edit channel"
          >
            <IconButton size="sm" variant="secondary" label="Edit channel">
              <HiPencilSquare />
            </IconButton>
          </Link>
        </div>
      </td>
    </tr>
  );
}

function ChannelMobileCard({ channel }: { channel: TwitchChannelView }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-secondary-200 border-l-4 border-l-purple-500 bg-white p-3 shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950">
      <div className="flex flex-col gap-3">
        <Link
          href={`/twitch/${channel.id}`}
          className="flex items-center gap-3"
        >
          <ChannelAvatar channel={channel} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              {channel.name}
            </h3>
            <p className="truncate text-xs text-secondary-500 dark:text-secondary-400">
              @{channel.username}
            </p>
          </div>
          <StatusBadge active={channel.is_active} />
        </Link>

        <div className="text-xs text-secondary-500 dark:text-secondary-400">
          Ultima live: {formatLastLive(channel.last_live_at)}
        </div>

        <div className="flex items-center justify-end gap-1.5 border-t border-secondary-200 pt-2 dark:border-secondary-800">
          <a
            href={channel.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open on Twitch"
          >
            <IconButton size="sm" variant="secondary" label="Open on Twitch">
              <HiArrowTopRightOnSquare />
            </IconButton>
          </a>
          <Link href={`/twitch/${channel.id}/edit`} aria-label="Edit channel">
            <IconButton size="sm" variant="secondary" label="Edit channel">
              <HiPencilSquare />
            </IconButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
