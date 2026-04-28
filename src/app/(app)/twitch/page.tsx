"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiMagnifyingGlass,
  HiPlayCircle,
  HiPlus,
  HiSquares2X2,
  HiUserGroup,
  HiVideoCamera,
} from "react-icons/hi2";

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
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Twitch Channels</h1>
        <Link href="/twitch/new">
          <Button
            size="sm"
            variant="primary"
            className="bg-purple-500 hover:bg-purple-600"
          >
            Add Channel
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
        <StatCard
          icon={<HiUserGroup className="h-4 w-4 text-white sm:h-5 sm:w-5" />}
          iconBg="bg-purple-500"
          label="Total Channels"
          value={channels.length}
        />
        <StatCard
          icon={<HiPlayCircle className="h-4 w-4 text-white sm:h-5 sm:w-5" />}
          iconBg="bg-red-500"
          label="Live Now"
          value={liveChannelsCount}
        />
        <StatCard
          icon={<HiSquares2X2 className="h-4 w-4 text-white sm:h-5 sm:w-5" />}
          iconBg="bg-blue-500"
          label="Active Channels"
          value={activeChannelsCount}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <Input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
            fullWidth
          />
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
        ) : error ? (
          <p className="py-12 text-center text-sm text-danger">
            Couldn&rsquo;t load the channels. Try refreshing.
          </p>
        ) : filteredChannels.length === 0 && searchTerm ? (
          <div className="py-8 text-center sm:py-12">
            <HiMagnifyingGlass className="mx-auto h-10 w-10 text-zinc-400 sm:h-12 sm:w-12" />
            <h3 className="mt-2 text-sm font-medium">No channels found</h3>
            <p className="mt-1 text-sm text-zinc-500">
              No channels match &ldquo;{searchTerm}&rdquo;.
            </p>
          </div>
        ) : channels.length === 0 ? (
          <div className="py-8 text-center sm:py-12">
            <HiVideoCamera className="mx-auto h-10 w-10 text-zinc-400 sm:h-12 sm:w-12" />
            <h3 className="mt-2 text-sm font-medium">
              No Twitch channels configured.
            </h3>
            <p className="mt-1 px-4 text-sm text-zinc-500">
              Aggiungi i tuoi canali Twitch preferiti per seguire le loro live.
            </p>
            <div className="mt-6">
              <Link href="/twitch/new">
                <Button
                  variant="primary"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <HiPlus className="mr-1 h-5 w-5" />
                  Add Twitch Channel
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <Th>Channel</Th>
                    <Th>Stato</Th>
                    <Th>Ultima Live</Th>
                    <Th>Azioni</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
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
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center">
        <div className="shrink-0">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${iconBg}`}
          >
            {icon}
          </div>
        </div>
        <div className="ml-3 w-0 flex-1 sm:ml-5">
          <dt className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm">
            {label}
          </dt>
          <dd className="text-base font-medium sm:text-lg">{value}</dd>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
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
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function formatLastLive(iso: string | null) {
  if (!iso) return "Mai";
  return new Date(iso).toLocaleDateString("it-IT");
}

function ChannelRow({ channel }: { channel: TwitchChannelView }) {
  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <ChannelAvatar channel={channel} />
          <div className="ml-4">
            <div className="text-sm font-medium">{channel.name}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              @{channel.username}
            </div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <StatusBadge active={channel.is_active} />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
        {formatLastLive(channel.last_live_at)}
      </td>
      <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
        >
          View
        </a>
        <Link
          href={`/twitch/${channel.id}/edit`}
          className="font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}

function ChannelMobileCard({ channel }: { channel: TwitchChannelView }) {
  return (
    <div className="rounded-lg border border-zinc-200 border-l-4 border-l-purple-500 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ChannelAvatar channel={channel} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{channel.name}</h3>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              @{channel.username}
            </p>
          </div>
          <StatusBadge active={channel.is_active} />
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Ultima live: {formatLastLive(channel.last_live_at)}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <a href={channel.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary" fullWidth>
              View
            </Button>
          </a>
          <Link href={`/twitch/${channel.id}/edit`}>
            <Button size="sm" variant="secondary" fullWidth>
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
