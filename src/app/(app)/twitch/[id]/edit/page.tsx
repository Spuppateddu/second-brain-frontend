"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import { TwitchChannelForm } from "@/components/twitch/TwitchChannelForm";
import {
  useTwitchChannel,
  useUpdateTwitchChannel,
} from "@/lib/queries/heavy";

export default function EditTwitchChannelPage({
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
  const update = useUpdateTwitchChannel(channelId);

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
        title="Edit Twitch Channel"
        isLoading={isLoading}
        error={error}
      >
        <p className="text-sm text-zinc-500">Loading…</p>
      </EntityListShell>
    );
  }

  return (
    <TwitchChannelForm
      mode="edit"
      channel={data.channel}
      isPending={update.isPending}
      onSubmit={async (payload) => {
        await update.mutateAsync(payload);
        router.push("/twitch");
      }}
    />
  );
}
