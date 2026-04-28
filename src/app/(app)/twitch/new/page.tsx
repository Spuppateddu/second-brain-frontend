"use client";

import { useRouter } from "next/navigation";

import { TwitchChannelForm } from "@/components/twitch/TwitchChannelForm";
import { useCreateTwitchChannel } from "@/lib/queries/heavy";

export default function NewTwitchChannelPage() {
  const router = useRouter();
  const create = useCreateTwitchChannel();

  return (
    <TwitchChannelForm
      mode="create"
      isPending={create.isPending}
      onSubmit={async (payload) => {
        await create.mutateAsync(payload);
        router.push("/twitch");
      }}
    />
  );
}
