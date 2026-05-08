"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { HiArrowLongLeft, HiInformationCircle } from "react-icons/hi2";

import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <header>
          <Link href="/youtube">
            <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
              Back to YouTube
            </Button>
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Add YouTube channel
          </h1>
        </header>

        <FormSection title="Channel">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="channel_id"
              type="text"
              label="YouTube channel ID or URL"
              value={channelIdInput}
              onChange={(e) => setChannelIdInput(e.target.value)}
              placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
              error={errors.channel_id}
              helperText={
                errors.channel_id
                  ? undefined
                  : "Paste the channel ID (starts with UC) or a youtube.com/channel/UC… URL"
              }
              required
              fullWidth
            />

            <div className="space-y-3">
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
            </div>

            {generalError ? (
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {generalError}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.push("/youtube")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={create.isPending}
                disabled={create.isPending}
              >
                Add channel
              </Button>
            </div>
          </form>
        </FormSection>

        <div className="rounded-[var(--radius-card)] border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
          <div className="flex items-start gap-3">
            <HiInformationCircle className="h-5 w-5 shrink-0 text-info-500" />
            <div>
              <h3 className="text-sm font-medium text-info-800 dark:text-info-200">
                How to find a YouTube channel ID
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-info-700 dark:text-info-300">
                <li>Open the YouTube channel in your browser</li>
                <li>
                  If the URL looks like <code>youtube.com/channel/UC…</code>,
                  paste it as is — the ID will be extracted automatically
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
