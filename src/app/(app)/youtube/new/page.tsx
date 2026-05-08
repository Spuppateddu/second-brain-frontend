"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { HiInformationCircle } from "react-icons/hi2";

import { Input } from "@/components/UI/Input";
import {
  useCreateYoutubeChannel,
  type YoutubeChannelInput,
} from "@/lib/queries/heavy";

type FormErrors = Partial<Record<keyof YoutubeChannelInput, string>>;

function extractChannelId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/youtube\.com\/channel\/(UC[\w-]+)/i);
  return match ? match[1] : trimmed;
}

export default function NewYoutubeChannelPage() {
  const router = useRouter();
  const create = useCreateYoutubeChannel();

  const [channelIdInput, setChannelIdInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    try {
      await create.mutateAsync({
        channel_id: extractChannelId(channelIdInput),
        is_active: isActive,
        push_notifications_enabled: pushEnabled,
      });
      router.push("/youtube");
    } catch (err) {
      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string | string[]>;
            };
          };
        }
      )?.response;

      const fieldErrors = response?.data?.errors;
      if (fieldErrors) {
        const next: FormErrors = {};
        for (const [key, value] of Object.entries(fieldErrors)) {
          const message = Array.isArray(value) ? value[0] : value;
          if (
            key === "channel_id" ||
            key === "is_active" ||
            key === "push_notifications_enabled"
          ) {
            next[key as keyof YoutubeChannelInput] = message;
          }
        }
        setErrors(next);
        if (Object.keys(next).length === 0) {
          setGeneralError(response?.data?.message ?? "Failed to save.");
        }
      } else {
        setGeneralError(response?.data?.message ?? "Failed to save.");
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-3 py-6 sm:px-6 sm:py-12">
      <h1 className="text-xl font-semibold sm:text-2xl">Add YouTube Channel</h1>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <Input
              id="channel_id"
              type="text"
              label="YouTube Channel ID or URL"
              value={channelIdInput}
              onChange={(e) => setChannelIdInput(e.target.value)}
              placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
              error={errors.channel_id}
              required
              fullWidth
            />
            {!errors.channel_id ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Paste the channel ID (starts with UC) or a
                youtube.com/channel/UC… URL
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-danger-600 shadow-sm focus:ring-danger-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Active (automatically sync new videos from this channel)
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="rounded border-zinc-300 text-danger-600 shadow-sm focus:ring-danger-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Send push notification when this channel uploads a new video
                </span>
              </label>
            </div>
          </div>

          {generalError ? (
            <p className="text-sm text-danger">{generalError}</p>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/youtube")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={create.isPending}
            >
              {create.isPending ? "Adding…" : "Add Channel"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/30">
        <div className="flex items-start">
          <HiInformationCircle className="h-5 w-5 shrink-0 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              How to find a YouTube channel ID
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <ul className="list-disc space-y-1 pl-5">
                <li>Open the YouTube channel in your browser</li>
                <li>
                  If the URL looks like{" "}
                  <code>youtube.com/channel/UC…</code>, paste it as is — the ID
                  will be extracted automatically
                </li>
                <li>
                  For <code>@handle</code> URLs, open any video on the channel,
                  click the channel name, then copy the URL — it will switch to
                  the <code>/channel/UC…</code> form
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
